import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Board } from './components/board/Board';
import { Dashboard } from './components/dashboard/Dashboard';
import { Archive } from './components/archive/Archive';
import { InboxSidebar } from './components/inbox/InboxSidebar';
import { CommandMenu } from './components/command/CommandMenu';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskDetailDrawer } from './components/task/TaskDetailDrawer';
import { Toast, ToastItem } from './components/common/Toast';
import { useTasks } from './hooks/useTasks';
import { usePomodoro } from './context/PomodoroContext';
import { Task } from './types';
import {
  DndContext,
  DragOverEvent,
  DragStartEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableTask } from './components/board/SortableTask';

const SIDEBAR_COLLAPSED_KEY = 'myplaner_sidebar_collapsed';

export default function App() {
  const [view, setView] = useState<'board' | 'dashboard' | 'archive'>('board');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { startFocusOnTask } = usePomodoro();

  const {
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
  } = useTasks();

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const showToast = (item: Omit<ToastItem, 'id'>) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ ...item, id: String(Date.now()) });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleDeleteWithUndo = (id: string) => {
    const deleted = deleteTaskPermanently(id);
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
    if (deleted) {
      showToast({
        message: 'Задача удалена',
        undoLabel: 'Отменить',
        onUndo: () => reinsertTask(deleted),
      });
    }
  };

  const handleArchiveCompletedWithToast = () => {
    const moved = archiveCompletedTasks();
    if (moved > 0) {
      showToast({
        message: `В архив перенесено задач: ${moved}`,
      });
    }
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
  };

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) || null : null;
  const inboxTasks = tasks.filter((t) => t.columnId === 'inbox');
  const activeInboxCount = inboxTasks.filter((t) => !t.checked).length;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 140,
        tolerance: 7,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'i' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsInboxOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dragActiveId = active.id;
    const overId = over.id;
    if (dragActiveId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isOverTask) {
      setTasksLocalOnly((prevTasks) => {
        const activeIndex = prevTasks.findIndex((t) => t.id === dragActiveId);
        const overIndex = prevTasks.findIndex((t) => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return prevTasks;

        if (prevTasks[activeIndex].columnId !== prevTasks[overIndex].columnId) {
          const newTasks = [...prevTasks];
          const targetCol = prevTasks[overIndex].columnId;
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            columnId: targetCol,
            originalColumnId: targetCol !== 'archive' ? targetCol : newTasks[activeIndex].originalColumnId,
          };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return prevTasks;
      });
    } else if (isOverColumn) {
      setTasksLocalOnly((prevTasks) => {
        const activeIndex = prevTasks.findIndex((t) => t.id === dragActiveId);
        if (activeIndex === -1) return prevTasks;

        const targetCol = overId as string;
        if (prevTasks[activeIndex].columnId !== targetCol) {
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            columnId: targetCol,
            originalColumnId: targetCol !== 'archive' ? targetCol : newTasks[activeIndex].originalColumnId,
          };
          return arrayMove(newTasks, activeIndex, newTasks.length - 1);
        }
        return prevTasks;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      commitOrderChange(tasksRef.current);
      return;
    }

    const dragActiveId = active.id;
    const overId = over.id;

    let finalTasks = tasksRef.current;

    if (dragActiveId !== overId) {
      const isActiveTask = active.data.current?.type === 'Task';
      const isOverTask = over.data.current?.type === 'Task';

      if (isActiveTask && isOverTask) {
        const activeIndex = finalTasks.findIndex((t) => t.id === dragActiveId);
        const overIndex = finalTasks.findIndex((t) => t.id === overId);
        if (
          activeIndex !== -1 &&
          overIndex !== -1 &&
          finalTasks[activeIndex].columnId === finalTasks[overIndex].columnId
        ) {
          finalTasks = arrayMove(finalTasks, activeIndex, overIndex);
        }
      }
    }

    commitOrderChange(finalTasks);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      autoScroll={{
        threshold: { x: 0.2, y: 0.2 },
        acceleration: 15,
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen w-screen bg-[#000000] text-[#F7F8F8] overflow-hidden selection:bg-[#00BCC5]/30 relative font-sans">
        <Sidebar
          currentView={view}
          setView={setView}
          onToggleInbox={() => setIsInboxOpen((prev) => !prev)}
          inboxCount={activeInboxCount}
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          syncStatus={syncStatus}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-14 md:pb-0">
          {view === 'board' && (
            <Board
              tasks={tasks}
              customColumnTitles={customColumnTitles}
              onToggleTask={toggleTask}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={handleDeleteWithUndo}
              onSelectTask={handleSelectTask}
              onRenameColumn={renameColumn}
            />
          )}
          {view === 'dashboard' && (
            <Dashboard
              tasks={tasks}
              onToggleTask={toggleTask}
              onSelectTask={handleSelectTask}
            />
          )}
          {view === 'archive' && (
            <Archive
              tasks={tasks}
              customColumnTitles={customColumnTitles}
              onRestore={restoreTask}
              onDeletePermanently={handleDeleteWithUndo}
              onArchiveCompleted={handleArchiveCompletedWithToast}
              onClearArchive={clearArchive}
            />
          )}
        </main>

        <InboxSidebar
          isOpen={isInboxOpen}
          onClose={() => setIsInboxOpen(false)}
          tasks={inboxTasks}
          onToggleTask={toggleTask}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={handleDeleteWithUndo}
          onSelectTask={handleSelectTask}
          isDragging={activeId !== null}
        />

        {/* Task Details Slide-Over Drawer */}
        <TaskDetailDrawer
          task={selectedTask}
          customColumnTitles={customColumnTitles}
          onClose={() => setSelectedTaskId(null)}
          onToggleTask={toggleTask}
          onUpdateTask={updateTask}
          onDeleteTask={handleDeleteWithUndo}
          onStartFocus={(t) => {
            startFocusOnTask(t);
            showToast({ message: `Фокус 25 мин: ${t.content.slice(0, 36)}` });
          }}
        />

        {/* Command Menu */}
        <CommandMenu
          isOpen={isCommandMenuOpen}
          onClose={() => setIsCommandMenuOpen(false)}
          onNavigate={(newView) => setView(newView)}
          onToggleInbox={() => setIsInboxOpen((prev) => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onSelectTask={handleSelectTask}
          onArchiveCompleted={handleArchiveCompletedWithToast}
          onForceSync={forceSyncNow}
          customColumnTitles={customColumnTitles}
          tasks={tasks}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          syncStatus={syncStatus}
          lastSyncError={lastSyncError}
          lastSyncedAt={lastSyncedAt}
          tasks={tasks}
          onArchiveCompleted={handleArchiveCompletedWithToast}
          onClearArchive={clearArchive}
          onForceSync={forceSyncNow}
        />

        {/* Undo Toast */}
        <Toast toast={toast} onDismiss={() => setToast(null)} />

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
          }}
        >
          {activeId && tasks.find((t) => t.id === activeId) ? (
            <SortableTask
              task={tasks.find((t) => t.id === activeId)!}
              onToggle={toggleTask}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
