import { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '@/types';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { db, collection, doc, onSnapshot, writeBatch } from '../lib/firebase';

const STORAGE_KEY = 'planner2026_linear_tasks';
const DATE_KEY = 'planner2026_last_date';

const defaultTasks: Task[] = [
  { id: '1', columnId: 'focus', originalColumnId: 'focus', content: 'Определить ключевые цели на месяц', checked: false, order: 0 },
  { id: '2', columnId: 'tasks', originalColumnId: 'tasks', content: 'Синхронизация между iPad, телефоном и ПК', checked: true, order: 1, completedAt: new Date().toISOString() },
  { id: '3', columnId: 'tasks', originalColumnId: 'tasks', content: 'Реализовать Drag and Drop с помощью dnd-kit', checked: true, order: 2, completedAt: new Date().toISOString() },
  { id: '4', columnId: 'habits', originalColumnId: 'habits', content: 'Прочитать 20 страниц', checked: false, order: 3 },
  { id: '5', columnId: 'personal', originalColumnId: 'personal', content: 'Записаться к врачу', checked: false, order: 4 },
];

function getStoredTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let parsed: Task[] = stored ? JSON.parse(stored) : defaultTasks;

    const lastDate = localStorage.getItem(DATE_KEY);
    const today = format(new Date(), 'yyyy-MM-dd');

    // Auto-archive on date rollover
    if (lastDate && lastDate !== today) {
      const nowIso = new Date().toISOString();
      parsed = parsed.map((t: Task) =>
        t.checked && t.columnId !== 'archive'
          ? {
              ...t,
              columnId: 'archive',
              originalColumnId: t.originalColumnId || t.columnId,
              archivedAt: t.archivedAt || nowIso,
            }
          : t
      );
    }

    localStorage.setItem(DATE_KEY, today);
    return parsed;
  } catch (e) {
    console.error('Failed to read tasks from localStorage', e);
    return defaultTasks;
  }
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasksState] = useState<Task[]>(getStoredTasks);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
  
  // Track Firestore document IDs currently known
  const knownRemoteDocIds = useRef<Set<string>>(new Set());
  const isRemoteUpdate = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const initialMigrationDone = useRef(false);

  // Helper to commit tasks list to Firestore in a batch
  const syncToFirestore = useCallback((userId: string, currentTasks: Task[], knownIds: Set<string>) => {
    setSyncStatus('syncing');
    const batch = writeBatch(db);
    const currentIdSet = new Set<string>();

    currentTasks.forEach((task, index) => {
      currentIdSet.add(task.id);
      const docRef = doc(db, 'users', userId, 'tasks', task.id);
      batch.set(
        docRef,
        {
          id: task.id,
          columnId: task.columnId,
          originalColumnId: task.originalColumnId || task.columnId,
          content: task.content,
          checked: task.checked,
          order: index,
          updatedAt: Date.now(),
          completedAt: task.completedAt || null,
          archivedAt: task.archivedAt || null,
        },
        { merge: true }
      );
    });

    // Delete tasks that exist in remote Firestore but were deleted locally
    knownIds.forEach((id) => {
      if (!currentIdSet.has(id)) {
        const docRef = doc(db, 'users', userId, 'tasks', id);
        batch.delete(docRef);
      }
    });

    return batch
      .commit()
      .then(() => {
        knownRemoteDocIds.current = currentIdSet;
        setSyncStatus('synced');
      })
      .catch((err) => {
        console.error('Failed to commit batch to Firestore:', err);
        setSyncStatus('offline');
      });
  }, []);

  // 1. Real-time Firestore sync listener
  useEffect(() => {
    if (!user) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    const tasksColRef = collection(db, 'users', user.uid, 'tasks');

    const unsubscribe = onSnapshot(
      tasksColRef,
      (snapshot) => {
        // If user has zero tasks in Firestore, migrate their current local tasks
        if (snapshot.empty && !initialMigrationDone.current) {
          initialMigrationDone.current = true;
          const currentLocal = getStoredTasks();
          if (currentLocal.length > 0) {
            syncToFirestore(user.uid, currentLocal, new Set());
          }
          setSyncStatus('synced');
          return;
        }

        const remoteTasks: Task[] = [];
        const remoteIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteIds.add(docSnap.id);
          remoteTasks.push({
            id: docSnap.id,
            columnId: data.columnId || 'tasks',
            originalColumnId: data.originalColumnId || data.columnId || 'tasks',
            content: data.content || '',
            checked: Boolean(data.checked),
            order: typeof data.order === 'number' ? data.order : 0,
            updatedAt: data.updatedAt || 0,
            completedAt: data.completedAt || undefined,
            archivedAt: data.archivedAt || undefined,
          });
        });

        remoteTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        knownRemoteDocIds.current = remoteIds;

        // Mark that this state change came from server to avoid loop
        isRemoteUpdate.current = true;
        setTasksState(remoteTasks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteTasks));
        setSyncStatus('synced');
      },
      (error) => {
        console.error('Firestore tasks subscription error:', error);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, [user, syncToFirestore]);

  // Update tasks locally immediately and schedule debounced sync to Firestore
  const setTasks = useCallback(
    (action: Task[] | ((prev: Task[]) => Task[])) => {
      setTasksState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

        // If update was triggered by remote onSnapshot, don't write back to Firestore
        if (isRemoteUpdate.current) {
          isRemoteUpdate.current = false;
          return next;
        }

        // Debounce Firestore save by 350ms for smooth 60fps interaction
        if (user) {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(() => {
            syncToFirestore(user.uid, next, knownRemoteDocIds.current);
          }, 350);
        }

        return next;
      });
    },
    [user, syncToFirestore]
  );

  // Helper actions
  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const newChecked = !t.checked;
          return {
            ...t,
            checked: newChecked,
            completedAt: newChecked ? (t.completedAt || new Date().toISOString()) : undefined,
          };
        }
        return t;
      })
    );
  }, [setTasks]);

  const addTask = useCallback((columnId: string, content: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      columnId,
      originalColumnId: columnId,
      content,
      checked: false,
      order: Date.now(),
    };
    setTasks(prev => [...prev, newTask]);
  }, [setTasks]);

  const restoreTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            columnId: t.originalColumnId && t.originalColumnId !== 'archive' ? t.originalColumnId : 'tasks',
            checked: false,
            archivedAt: undefined,
          };
        }
        return t;
      })
    );
  }, [setTasks]);

  const deleteTaskPermanently = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);

  const archiveCompletedTasks = useCallback(() => {
    const nowIso = new Date().toISOString();
    let movedCount = 0;
    setTasks(prev =>
      prev.map(t => {
        if (t.checked && t.columnId !== 'archive') {
          movedCount++;
          return {
            ...t,
            columnId: 'archive',
            originalColumnId: t.originalColumnId || t.columnId,
            archivedAt: t.archivedAt || nowIso,
          };
        }
        return t;
      })
    );
    return movedCount;
  }, [setTasks]);

  const clearArchive = useCallback((onlyOlderThanDays?: number) => {
    setTasks(prev => {
      if (!onlyOlderThanDays) {
        return prev.filter(t => t.columnId !== 'archive');
      }
      const cutoff = Date.now() - onlyOlderThanDays * 24 * 60 * 60 * 1000;
      return prev.filter(t => {
        if (t.columnId !== 'archive') return true;
        const archTime = t.archivedAt ? new Date(t.archivedAt).getTime() : 0;
        return archTime > cutoff;
      });
    });
  }, [setTasks]);

  const forceSyncNow = useCallback(async () => {
    if (!user) return;
    return syncToFirestore(user.uid, tasks, knownRemoteDocIds.current);
  }, [user, tasks, syncToFirestore]);

  return {
    tasks,
    setTasks,
    syncStatus,
    toggleTask,
    addTask,
    restoreTask,
    deleteTaskPermanently,
    archiveCompletedTasks,
    clearArchive,
    forceSyncNow,
  };
}
