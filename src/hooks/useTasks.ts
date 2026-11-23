import { useState, useEffect, useRef, useCallback } from 'react';
import { BoardColumnId, CustomColumnTitles, Subtask, SyncStatus, Task, TaskPriority } from '@/types';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase';

const STORAGE_KEY = 'planner2026_linear_tasks';
const DATE_KEY = 'planner2026_last_date';
const COLUMN_TITLES_KEY = 'planner2026_column_titles';

const VALID_COLUMNS = new Set(['focus', 'tasks', 'calls', 'habits', 'personal', 'inbox', 'archive']);

const defaultTasks: Task[] = [
  { id: '1', columnId: 'focus', originalColumnId: 'focus', content: 'Определить ключевые цели на месяц', checked: false, order: 0 },
  { id: '2', columnId: 'tasks', originalColumnId: 'tasks', content: 'Синхронизация между iPad, телефоном и ПК', checked: true, order: 1, completedAt: new Date().toISOString() },
  { id: '3', columnId: 'tasks', originalColumnId: 'tasks', content: 'Разобрать входящие задачи в Инбоксе', checked: false, order: 2 },
  { id: '4', columnId: 'habits', originalColumnId: 'habits', content: 'Прочитать 20 страниц', checked: false, order: 3, streak: 3, lastCompletedDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'), habitHistory: [format(subDays(new Date(), 3), 'yyyy-MM-dd'), format(subDays(new Date(), 2), 'yyyy-MM-dd'), format(subDays(new Date(), 1), 'yyyy-MM-dd')] },
  { id: '5', columnId: 'personal', originalColumnId: 'personal', content: 'Записаться к врачу', checked: false, order: 4 },
];

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function yesterdayStr(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

function sanitizeColumnId(col?: string): string {
  return col && VALID_COLUMNS.has(col) ? col : 'tasks';
}

function sanitizeSubtasks(subtasks?: Subtask[]): Subtask[] | null {
  if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) return null;
  return subtasks
    .slice(0, 30)
    .map((s) => ({
      id: String(s.id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'sub',
      content: String(s.content || '').trim().slice(0, 300),
      checked: Boolean(s.checked),
    }))
    .filter((s) => s.content.length > 0);
}

function sanitizeHabitHistory(history?: string[]): string[] | null {
  if (!history || !Array.isArray(history) || history.length === 0) return null;
  const unique = Array.from(new Set(history.map((d) => String(d).slice(0, 20)))).sort();
  return unique.slice(-60);
}

function buildFirestoreTaskPayload(userId: string, task: Task, orderOverride?: number) {
  const safeId = String(task.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `t-${Date.now()}`;
  const safeContent = String(task.content || 'Задача').trim().slice(0, 500) || 'Задача';
  const safeNotes = task.notes ? String(task.notes).slice(0, 5000) : null;
  const safePriority: TaskPriority | null =
    task.priority === 'low' || task.priority === 'medium' || task.priority === 'high'
      ? task.priority
      : null;

  return {
    id: safeId,
    ownerId: userId,
    columnId: sanitizeColumnId(task.columnId),
    originalColumnId: sanitizeColumnId(task.originalColumnId || task.columnId),
    content: safeContent,
    checked: Boolean(task.checked),
    order: typeof orderOverride === 'number' ? orderOverride : (typeof task.order === 'number' ? task.order : 0),
    notes: safeNotes,
    priority: safePriority,
    subtasks: sanitizeSubtasks(task.subtasks),
    streak: typeof task.streak === 'number' ? Math.max(0, Math.min(10000, Math.floor(task.streak))) : null,
    lastCompletedDate: task.lastCompletedDate ? String(task.lastCompletedDate).slice(0, 20) : null,
    habitHistory: sanitizeHabitHistory(task.habitHistory),
    completedAt: task.completedAt ? String(task.completedAt).slice(0, 64) : null,
    archivedAt: task.archivedAt ? String(task.archivedAt).slice(0, 64) : null,
    updatedAt: serverTimestamp(),
  };
}

function applyDailyRollover(list: Task[], today: string, yesterday: string): { next: Task[]; changedIds: Set<string> } {
  const nowIso = new Date().toISOString();
  const changedIds = new Set<string>();

  const next = list.map((t) => {
    // 1. Habits reset each morning instead of getting archived
    if (t.columnId === 'habits') {
      const completedToday = t.lastCompletedDate === today;
      const completedYesterday = t.lastCompletedDate === yesterday;
      const currentStreak = t.streak || 0;

      if (completedToday) {
        return t;
      }

      const nextStreak = completedYesterday ? currentStreak : 0;
      const needsUncheck = t.checked;
      const needsStreakReset = nextStreak !== currentStreak;

      if (needsUncheck || needsStreakReset) {
        changedIds.add(t.id);
        return {
          ...t,
          checked: false,
          streak: nextStreak,
        };
      }
      return t;
    }

    // 2. Regular completed tasks move to archive on a new day
    if (t.checked && t.columnId !== 'archive') {
      changedIds.add(t.id);
      return {
        ...t,
        columnId: 'archive',
        originalColumnId: t.originalColumnId || t.columnId,
        archivedAt: t.archivedAt || nowIso,
      };
    }

    return t;
  });

  return { next, changedIds };
}

function getStoredTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let parsed: Task[] = stored ? JSON.parse(stored) : defaultTasks;

    const lastDate = localStorage.getItem(DATE_KEY);
    const today = todayStr();

    if (lastDate && lastDate !== today) {
      const { next } = applyDailyRollover(parsed, today, yesterdayStr());
      parsed = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    localStorage.setItem(DATE_KEY, today);
    return parsed;
  } catch (e) {
    console.error('Failed to read tasks from localStorage', e);
    return defaultTasks;
  }
}

function getStoredColumnTitles(): CustomColumnTitles {
  try {
    const raw = localStorage.getItem(COLUMN_TITLES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useTasks() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasksState] = useState<Task[]>(getStoredTasks);
  const [customColumnTitles, setCustomColumnTitles] = useState<CustomColumnTitles>(getStoredColumnTitles);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

  const customTitlesRef = useRef<CustomColumnTitles>(customColumnTitles);
  customTitlesRef.current = customColumnTitles;

  const initialMigrationDone = useRef(false);
  const rolloverCheckedForUser = useRef<string | null>(null);

  const persistLocal = useCallback((next: Task[]) => {
    tasksRef.current = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('localStorage save error:', e);
    }
  }, []);

  // Write a single task document directly to Firestore (no full-collection overwrites!)
  const writeSingleTask = useCallback(
    async (userId: string, task: Task) => {
      setSyncStatus('syncing');
      setLastSyncError(null);
      const path = `users/${userId}/tasks/${task.id}`;
      try {
        const docRef = doc(db, 'users', userId, 'tasks', task.id);
        await setDoc(docRef, buildFirestoreTaskPayload(userId, task));
        setSyncStatus('synced');
        setLastSyncedAt(Date.now());
      } catch (err) {
        const info = handleFirestoreError(err, OperationType.WRITE, path);
        setLastSyncError(info.error);
        setSyncStatus('offline');
      }
    },
    []
  );

  // Delete a single task document directly from Firestore
  const deleteSingleTask = useCallback(
    async (userId: string, taskId: string) => {
      setSyncStatus('syncing');
      setLastSyncError(null);
      const path = `users/${userId}/tasks/${taskId}`;
      try {
        const docRef = doc(db, 'users', userId, 'tasks', taskId);
        await deleteDoc(docRef);
        setSyncStatus('synced');
        setLastSyncedAt(Date.now());
      } catch (err) {
        const info = handleFirestoreError(err, OperationType.DELETE, path);
        setLastSyncError(info.error);
        setSyncStatus('offline');
      }
    },
    []
  );

  // Chunked batch write (safe for > 500 tasks)
  const commitTasksChunked = useCallback(
    async (userId: string, tasksToWrite: Task[], idsToDelete: string[] = []) => {
      if (tasksToWrite.length === 0 && idsToDelete.length === 0) return;
      setSyncStatus('syncing');
      setLastSyncError(null);
      const path = `users/${userId}/tasks`;

      try {
        const CHUNK_SIZE = 400;
        type Op = { type: 'set'; task: Task; order: number } | { type: 'delete'; id: string };
        const ops: Op[] = [
          ...tasksToWrite.map((t) => ({ type: 'set' as const, task: t, order: t.order ?? 0 })),
          ...idsToDelete.map((id) => ({ type: 'delete' as const, id })),
        ];

        for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
          const slice = ops.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          slice.forEach((op) => {
            if (op.type === 'set') {
              const docRef = doc(db, 'users', userId, 'tasks', op.task.id);
              batch.set(docRef, buildFirestoreTaskPayload(userId, op.task, op.order));
            } else {
              const docRef = doc(db, 'users', userId, 'tasks', op.id);
              batch.delete(docRef);
            }
          });
          await batch.commit();
        }

        setSyncStatus('synced');
        setLastSyncedAt(Date.now());
      } catch (err) {
        const info = handleFirestoreError(err, OperationType.WRITE, path);
        setLastSyncError(info.error);
        setSyncStatus('offline');
      }
    },
    []
  );

  // Save workspace preferences (rollover date & custom column titles)
  const savePreferences = useCallback(
    async (userId: string, patch: { lastRolloverDate?: string; columnTitles?: CustomColumnTitles }) => {
      const path = `users/${userId}/settings/preferences`;
      try {
        const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
        const nextTitles = patch.columnTitles ?? customTitlesRef.current;
        const cleanTitles: Record<string, string> = {};
        (['focus', 'tasks', 'calls', 'habits', 'personal'] as BoardColumnId[]).forEach((k) => {
          const val = nextTitles[k]?.trim();
          if (val) cleanTitles[k] = val.slice(0, 60);
        });

        await setDoc(prefRef, {
          ownerId: userId,
          lastRolloverDate: patch.lastRolloverDate ?? todayStr(),
          columnTitles: Object.keys(cleanTitles).length > 0 ? cleanTitles : null,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    []
  );

  // 1. Real-time Firestore listener for user's tasks & preferences
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      initialMigrationDone.current = false;
      rolloverCheckedForUser.current = null;
      setSyncStatus('offline');
      setLastSyncError(null);
      return;
    }

    setSyncStatus('syncing');
    setLastSyncError(null);

    const tasksPath = `users/${user.uid}/tasks`;
    const tasksColRef = collection(db, 'users', user.uid, 'tasks');

    const unsubTasks = onSnapshot(
      tasksColRef,
      (snapshot) => {
        // First sign-in on an empty cloud account -> migrate local tasks
        if (snapshot.empty && !initialMigrationDone.current) {
          initialMigrationDone.current = true;
          const currentLocal = tasksRef.current;
          if (currentLocal.length > 0) {
            const indexed = currentLocal.map((t, idx) => ({ ...t, order: idx }));
            commitTasksChunked(user.uid, indexed);
            savePreferences(user.uid, { lastRolloverDate: todayStr() });
          } else {
            setSyncStatus('synced');
            setLastSyncedAt(Date.now());
          }
          return;
        }

        initialMigrationDone.current = true;
        const remoteTasks: Task[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const updatedAtMs =
            data.updatedAt && typeof data.updatedAt.toMillis === 'function'
              ? data.updatedAt.toMillis()
              : typeof data.updatedAt === 'number'
              ? data.updatedAt
              : 0;

          remoteTasks.push({
            id: docSnap.id,
            ownerId: data.ownerId || user.uid,
            columnId: sanitizeColumnId(data.columnId),
            originalColumnId: sanitizeColumnId(data.originalColumnId || data.columnId),
            content: data.content || '',
            checked: Boolean(data.checked),
            order: typeof data.order === 'number' ? data.order : 0,
            notes: data.notes || undefined,
            priority: data.priority || undefined,
            subtasks: Array.isArray(data.subtasks) ? data.subtasks : undefined,
            streak: typeof data.streak === 'number' ? data.streak : undefined,
            lastCompletedDate: data.lastCompletedDate || undefined,
            habitHistory: Array.isArray(data.habitHistory) ? data.habitHistory : undefined,
            updatedAt: updatedAtMs,
            completedAt: data.completedAt || undefined,
            archivedAt: data.archivedAt || undefined,
          });
        });

        remoteTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Perform daily rollover once per session when date changed
        const today = todayStr();
        const storedDate = localStorage.getItem(DATE_KEY);
        if (rolloverCheckedForUser.current !== `${user.uid}:${today}` && storedDate && storedDate !== today) {
          rolloverCheckedForUser.current = `${user.uid}:${today}`;
          const { next, changedIds } = applyDailyRollover(remoteTasks, today, yesterdayStr());
          localStorage.setItem(DATE_KEY, today);
          setTasksState(next);
          persistLocal(next);
          if (changedIds.size > 0) {
            const changedTasks = next.filter((t) => changedIds.has(t.id));
            commitTasksChunked(user.uid, changedTasks);
            savePreferences(user.uid, { lastRolloverDate: today });
            return;
          }
        } else {
          rolloverCheckedForUser.current = `${user.uid}:${today}`;
          localStorage.setItem(DATE_KEY, today);
        }

        setTasksState(remoteTasks);
        persistLocal(remoteTasks);
        if (!snapshot.metadata.hasPendingWrites) {
          setSyncStatus('synced');
          setLastSyncedAt(Date.now());
        }
      },
      (error) => {
        const info = handleFirestoreError(error, OperationType.LIST, tasksPath);
        setLastSyncError(info.error);
        setSyncStatus('offline');
      }
    );

    const prefPath = `users/${user.uid}/settings/preferences`;
    const prefRef = doc(db, 'users', user.uid, 'settings', 'preferences');
    const unsubPrefs = onSnapshot(
      prefRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (data.columnTitles && typeof data.columnTitles === 'object') {
          const nextTitles = data.columnTitles as CustomColumnTitles;
          setCustomColumnTitles(nextTitles);
          customTitlesRef.current = nextTitles;
          localStorage.setItem(COLUMN_TITLES_KEY, JSON.stringify(nextTitles));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, prefPath);
      }
    );

    return () => {
      unsubTasks();
      unsubPrefs();
    };
  }, [user, authLoading, commitTasksChunked, persistLocal, savePreferences]);

  // Optimistic local setter used during drag-over (no Firestore write until drop!)
  const setTasksLocalOnly = useCallback(
    (action: Task[] | ((prev: Task[]) => Task[])) => {
      setTasksState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        persistLocal(next);
        return next;
      });
    },
    [persistLocal]
  );

  // Commit current board ordering & column changes after drag-and-drop ends
  const commitOrderChange = useCallback(
    (nextTasks: Task[]) => {
      const reindexed = nextTasks.map((t, index) => ({ ...t, order: index }));
      setTasksState(reindexed);
      persistLocal(reindexed);
      if (user) {
        // Only write active (non-archived) tasks or tasks whose order/column changed
        const activeOrBoardTasks = reindexed.filter((t) => t.columnId !== 'archive');
        commitTasksChunked(user.uid, activeOrBoardTasks);
      }
    },
    [user, persistLocal, commitTasksChunked]
  );

  // Toggle task completion (with Habit streak tracking!)
  const toggleTask = useCallback(
    (id: string) => {
      let updatedTask: Task | null = null;
      const today = todayStr();
      const yesterday = yesterdayStr();
      const nowIso = new Date().toISOString();

      setTasksState((prev) => {
        const next = prev.map((t) => {
          if (t.id !== id) return t;
          const newChecked = !t.checked;

          if (t.columnId === 'habits') {
            const history = Array.isArray(t.habitHistory) ? [...t.habitHistory] : [];
            let nextStreak = t.streak || 0;
            let nextLastCompleted = t.lastCompletedDate;

            if (newChecked) {
              if (!history.includes(today)) {
                history.push(today);
              }
              if (t.lastCompletedDate === today) {
                nextStreak = Math.max(1, nextStreak);
              } else if (t.lastCompletedDate === yesterday) {
                nextStreak = nextStreak + 1;
              } else {
                nextStreak = 1;
              }
              nextLastCompleted = today;
            } else {
              const filtered = history.filter((d) => d !== today);
              history.length = 0;
              history.push(...filtered);
              if (t.lastCompletedDate === today) {
                nextStreak = Math.max(0, nextStreak - 1);
                nextLastCompleted = filtered.length > 0 ? filtered[filtered.length - 1] : undefined;
              }
            }

            updatedTask = {
              ...t,
              checked: newChecked,
              streak: nextStreak,
              lastCompletedDate: nextLastCompleted,
              habitHistory: history.slice(-60),
              completedAt: newChecked ? nowIso : undefined,
            };
            return updatedTask;
          }

          updatedTask = {
            ...t,
            checked: newChecked,
            completedAt: newChecked ? nowIso : undefined,
          };
          return updatedTask;
        });

        persistLocal(next);
        return next;
      });

      if (user && updatedTask) {
        writeSingleTask(user.uid, updatedTask);
      }
    },
    [user, persistLocal, writeSingleTask]
  );

  const addTask = useCallback(
    (columnId: string, content: string, extra?: Partial<Task>) => {
      const trimmed = content.trim().slice(0, 500);
      if (!trimmed) return;
      const safeCol = sanitizeColumnId(columnId);
      const maxOrder = tasksRef.current.reduce((max, t) => Math.max(max, t.order ?? 0), -1);

      const newTask: Task = {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ownerId: user?.uid,
        columnId: safeCol,
        originalColumnId: safeCol,
        content: trimmed,
        checked: false,
        order: maxOrder + 1,
        ...extra,
      };

      const next = [...tasksRef.current, newTask];
      setTasksState(next);
      persistLocal(next);

      if (user) {
        writeSingleTask(user.uid, newTask);
      }
      return newTask;
    },
    [user, persistLocal, writeSingleTask]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      let updatedTask: Task | null = null;
      setTasksState((prev) => {
        const next = prev.map((t) => {
          if (t.id !== id) return t;
          const nextCol = updates.columnId ? sanitizeColumnId(updates.columnId) : t.columnId;
          updatedTask = {
            ...t,
            ...updates,
            columnId: nextCol,
            originalColumnId:
              nextCol !== 'archive' ? nextCol : t.originalColumnId || t.columnId,
            content:
              typeof updates.content === 'string'
                ? updates.content.trim().slice(0, 500) || t.content
                : t.content,
          };
          return updatedTask;
        });
        persistLocal(next);
        return next;
      });

      if (user && updatedTask) {
        writeSingleTask(user.uid, updatedTask);
      }
    },
    [user, persistLocal, writeSingleTask]
  );

  const deleteTaskPermanently = useCallback(
    (id: string): Task | null => {
      const existing = tasksRef.current.find((t) => t.id === id) || null;
      const next = tasksRef.current.filter((t) => t.id !== id);
      setTasksState(next);
      persistLocal(next);

      if (user) {
        deleteSingleTask(user.uid, id);
      }
      return existing;
    },
    [user, persistLocal, deleteSingleTask]
  );

  const reinsertTask = useCallback(
    (task: Task) => {
      const exists = tasksRef.current.some((t) => t.id === task.id);
      if (exists) return;
      const next = [...tasksRef.current, task].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setTasksState(next);
      persistLocal(next);

      if (user) {
        writeSingleTask(user.uid, task);
      }
    },
    [user, persistLocal, writeSingleTask]
  );

  const restoreTask = useCallback(
    (id: string) => {
      let updatedTask: Task | null = null;
      setTasksState((prev) => {
        const next = prev.map((t) => {
          if (t.id !== id) return t;
          updatedTask = {
            ...t,
            columnId:
              t.originalColumnId && t.originalColumnId !== 'archive'
                ? t.originalColumnId
                : 'tasks',
            checked: false,
            archivedAt: undefined,
          };
          return updatedTask;
        });
        persistLocal(next);
        return next;
      });

      if (user && updatedTask) {
        writeSingleTask(user.uid, updatedTask);
      }
    },
    [user, persistLocal, writeSingleTask]
  );

  // Archive completed tasks (strictly skips habits so streaks stay on board!)
  const archiveCompletedTasks = useCallback(() => {
    const nowIso = new Date().toISOString();
    const movedTasks: Task[] = [];

    setTasksState((prev) => {
      const next = prev.map((t) => {
        if (t.checked && t.columnId !== 'archive' && t.columnId !== 'habits') {
          const archived: Task = {
            ...t,
            columnId: 'archive',
            originalColumnId: t.originalColumnId || t.columnId,
            archivedAt: t.archivedAt || nowIso,
          };
          movedTasks.push(archived);
          return archived;
        }
        return t;
      });
      persistLocal(next);
      return next;
    });

    if (user && movedTasks.length > 0) {
      commitTasksChunked(user.uid, movedTasks);
    }
    return movedTasks.length;
  }, [user, persistLocal, commitTasksChunked]);

  const clearArchive = useCallback(
    (onlyOlderThanDays?: number) => {
      const idsToDelete: string[] = [];
      const cutoff = onlyOlderThanDays
        ? Date.now() - onlyOlderThanDays * 24 * 60 * 60 * 1000
        : null;

      setTasksState((prev) => {
        const next = prev.filter((t) => {
          if (t.columnId !== 'archive') return true;
          if (!cutoff) {
            idsToDelete.push(t.id);
            return false;
          }
          const archTime = t.archivedAt ? new Date(t.archivedAt).getTime() : 0;
          if (archTime <= cutoff) {
            idsToDelete.push(t.id);
            return false;
          }
          return true;
        });
        persistLocal(next);
        return next;
      });

      if (user && idsToDelete.length > 0) {
        commitTasksChunked(user.uid, [], idsToDelete);
      }
    },
    [user, persistLocal, commitTasksChunked]
  );

  const renameColumn = useCallback(
    (columnId: BoardColumnId, newTitle: string) => {
      const clean = newTitle.trim().slice(0, 60);
      const nextTitles: CustomColumnTitles = { ...customTitlesRef.current };
      if (clean) {
        nextTitles[columnId] = clean;
      } else {
        delete nextTitles[columnId];
      }
      setCustomColumnTitles(nextTitles);
      customTitlesRef.current = nextTitles;
      localStorage.setItem(COLUMN_TITLES_KEY, JSON.stringify(nextTitles));

      if (user) {
        savePreferences(user.uid, { columnTitles: nextTitles });
      }
    },
    [user, savePreferences]
  );

  const forceSyncNow = useCallback(async () => {
    if (!user) return;
    const indexed = tasksRef.current.map((t, i) => ({ ...t, order: i }));
    await commitTasksChunked(user.uid, indexed);
    await savePreferences(user.uid, {
      lastRolloverDate: todayStr(),
      columnTitles: customTitlesRef.current,
    });
  }, [user, commitTasksChunked, savePreferences]);

  return {
    tasks,
    setTasksLocalOnly,
    commitOrderChange,
    customColumnTitles,
    renameColumn,
    syncStatus,
    lastSyncError,
    lastSyncedAt,
    toggleTask,
    addTask,
    updateTask,
    restoreTask,
    deleteTaskPermanently,
    reinsertTask,
    archiveCompletedTasks,
    clearArchive,
    forceSyncNow,
  };
}
