import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Board } from './components/board/Board';
import { Dashboard } from './components/dashboard/Dashboard';
import { Archive } from './components/archive/Archive';
import { InboxSidebar } from './components/inbox/InboxSidebar';
import { useTasks } from './hooks/useTasks';
import { DndContext, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, KeyboardSensor, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableTask } from './components/board/SortableTask';

export default function App() {
  const [view, setView] = useState<'board' | 'dashboard' | 'archive'>('board');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [tasks, setTasks] = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  const addTask = (columnId: string, content: string) => {
    setTasks([...tasks, { id: Date.now().toString(), columnId, content, checked: false }]);
  };

  const restoreTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, columnId: 'tasks', checked: false } : t));
  };

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
          newTasks[activeIndex].columnId = prevTasks[overIndex].columnId;
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(prevTasks, activeIndex, overIndex);
      });
    } else if (isOverColumn) {
      setTasks(prevTasks => {
        const activeIndex = prevTasks.findIndex(t => t.id === activeId);
        if (prevTasks[activeIndex].columnId !== overId) {
          const newTasks = [...prevTasks];
          newTasks[activeIndex].columnId = overId as string;
          return newTasks;
        }
        return prevTasks;
      });
    }
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen w-screen bg-[#000000] text-[#F7F8F8] overflow-hidden selection:bg-[#00BCC5]/30 relative">
        <Sidebar currentView={view} setView={setView} onToggleInbox={() => setIsInboxOpen(true)} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {view === 'board' && <Board tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} />}
          {view === 'dashboard' && <Dashboard tasks={tasks} />}
          {view === 'archive' && <Archive tasks={tasks} onRestore={restoreTask} />}
        </main>

        <InboxSidebar 
          isOpen={isInboxOpen} 
          onClose={() => setIsInboxOpen(false)} 
          tasks={tasks.filter(t => t.columnId === 'inbox')}
          onToggleTask={toggleTask}
          onAddTask={addTask}
          isDragging={activeId !== null}
        />

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
        }}>
          {activeId ? (
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
