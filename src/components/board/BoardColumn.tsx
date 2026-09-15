import React, { useState } from 'react';
import { Column, Task } from '@/types';
import { Plus } from 'lucide-react';
import { SortableTask } from './SortableTask';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface Props {
  column: Column;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (columnId: string, content: string) => void;
}

export const BoardColumn: React.FC<Props> = ({ column, tasks, onToggleTask, onAddTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(column.id, newTaskText.trim());
      setNewTaskText('');
    }
    setIsAdding(false);
  };

  const columnColor = 
    column.id === 'focus' ? 'bg-[#C84638]' : 
    column.id === 'tasks' ? 'bg-[#C86A36]' : 
    'bg-[#00BCC5]';

  return (
    <div className="w-[300px] shrink-0 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${columnColor}`} />
          <h3 className="font-medium text-[#F7F8F8] text-[13px] tracking-tight">{column.title}</h3>
        </div>
        <span className="text-[11px] font-medium text-[#8A8F98] bg-[#1A1A1C] px-1.5 py-0.5 rounded">
          {tasks.length}
        </span>
      </div>
      
      {/* Scrollable area for cards */}
      <div 
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2 pb-2 min-h-[100px] rounded-xl transition-colors ${isOver ? 'bg-[#1A1A1C]/50' : ''}`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} onToggle={onToggleTask} />
          ))}
        </SortableContext>

        {isAdding ? (
          <form onSubmit={handleAdd} className="mt-2">
            <input
              type="text"
              autoFocus
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onBlur={() => setIsAdding(false)}
              className="w-full bg-[#161618] border border-[#00BCC5] rounded-xl p-3 text-[13px] text-[#F7F8F8] outline-none"
              placeholder="Введите задачу..."
            />
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-[13px] text-[#8A8F98] hover:text-[#F7F8F8] p-2 hover:bg-[#1A1A1C] rounded-lg transition-colors mt-1 w-full text-left font-medium"
          >
            <Plus size={14} />
            Новая задача
          </button>
        )}
      </div>
    </div>
  );
}
