import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Board } from './components/board/Board';
import { Dashboard } from './components/dashboard/Dashboard';
import { Archive } from './components/archive/Archive';
import { InboxSidebar } from './components/inbox/InboxSidebar';
import { CommandMenu } from './components/command/CommandMenu';
import { SettingsModal } from './components/settings/SettingsModal';
import { useTasks } from './hooks/useTasks';
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
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableTask } from './components/board/SortableTask';

export default function App() {
  const [view, setView] = useState<'board' | 'dashboard' | 'archive'>('board');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
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
  } = useTasks();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120, // 120ms intentional touch-and-hold to start drag on iPad
        tolerance: 7, // allows natural micro-movement without cancelling
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsInboxOpen(prev => !prev);
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

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isOverTask) {
      setTasks(prevTasks => {
        const activeIndex = prevTasks.findIndex(t => t.id === activeId);
        const overIndex = prevTasks.findIndex(t => t.id === overId);
        
        if (prevTasks[activeIndex].columnId !== prevTasks[overIndex].columnId) {
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: prevTasks[overIndex].columnId };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return prevTasks;
      });
    } else if (isOverColumn) {
      setTasks(prevTasks => {
        const activeIndex = prevTasks.findIndex(t => t.id === activeId);
        if (prevTasks[activeIndex].columnId !== overId) {
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: overId as string };
          return arrayMove(newTasks, activeIndex, newTasks.length - 1);
        }
        return prevTasks;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';

    if (isActiveTask && isOverTask) {
      setTasks(prevTasks => {
        const activeIndex = prevTasks.findIndex(t => t.id === activeId);
        const overIndex = prevTasks.findIndex(t => t.id === overId);
        
        if (prevTasks[activeIndex].columnId === prevTasks[overIndex].columnId) {
          return arrayMove(prevTasks, activeIndex, overIndex);
        }
        return prevTasks;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      autoScroll={{
        threshold: {
          x: 0.2,
          y: 0.2,
        },
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
          onToggleInbox={() => setIsInboxOpen(prev => !prev)} 
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          syncStatus={syncStatus} 
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {view === 'board' && (
            <Board tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} />
          )}
          {view === 'dashboard' && <Dashboard tasks={tasks} />}
          {view === 'archive' && (
            <Archive 
              tasks={tasks} 
              onRestore={restoreTask} 
              onDeletePermanently={deleteTaskPermanently}
              onArchiveCompleted={archiveCompletedTasks}
              onClearArchive={clearArchive}
            />
          )}
        </main>

        <InboxSidebar 
          isOpen={isInboxOpen} 
          onClose={() => setIsInboxOpen(false)} 
          tasks={tasks.filter(t => t.columnId === 'inbox')}
          onToggleTask={toggleTask}
          onAddTask={addTask}
          isDragging={activeId !== null}
        />

        {/* Command Menu */}
        <CommandMenu
          isOpen={isCommandMenuOpen}
          onClose={() => setIsCommandMenuOpen(false)}
          onNavigate={(newView) => setView(newView)}
          onToggleInbox={() => setIsInboxOpen(prev => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onArchiveCompleted={archiveCompletedTasks}
          onForceSync={forceSyncNow}
          tasks={tasks}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          syncStatus={syncStatus}
          tasks={tasks}
          onArchiveCompleted={archiveCompletedTasks}
          onClearArchive={clearArchive}
          onForceSync={forceSyncNow}
        />

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
        }}>
          {activeId && tasks.find(t => t.id === activeId) ? (
            <SortableTask 
              task={tasks.find(t => t.id === activeId)!} 
              onToggle={toggleTask} 
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
