import { useState } from 'react';
import { Task } from '@/types';
import { X, Plus, Inbox } from 'lucide-react';
import { SortableTask } from '../board/SortableTask';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (columnId: string, content: string) => void;
  isDragging?: boolean;
}

export function InboxSidebar({ isOpen, onClose, tasks, onToggleTask, onAddTask, isDragging }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: 'inbox',
    data: { type: 'Column', column: { id: 'inbox', title: 'Инбокс' } }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask('inbox', newTaskText.trim());
      setNewTaskText('');
    }
    setIsAdding(false);
  };

  return (
    <>
      {isOpen && (
        <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={onClose}
        />
      )}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-[#0E0E0F] border-l border-[#222222] z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isDragging ? 'pointer-events-none' : ''}`}
      >
        <div className="h-[60px] shrink-0 border-b border-[#222222] flex items-center justify-between px-6 bg-[#0E0E0F]">
          <div className="flex items-center gap-3 text-[#F7F8F8]">
            <Inbox size={18} className="text-[#00BCC5]" />
            <span className="font-medium tracking-tight">Инбокс</span>
          </div>
          <button onClick={onClose} className="text-[#8A8F98] hover:text-[#F7F8F8] transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div 
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto p-4 space-y-2 transition-colors ${isOver ? 'bg-[#1A1A1C]/50' : ''}`}
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
                className="w-full bg-[#161618] border border-[#00BCC5] rounded-xl p-3 text-[13px] text-[#F7F8F8] outline-none shadow-sm"
                placeholder="Быстрая мысль..."
              />
            </form>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-[13px] text-[#8A8F98] hover:text-[#F7F8F8] p-3 border border-dashed border-[#333] hover:border-[#555] hover:bg-[#1A1A1C] rounded-xl transition-all mt-2 w-full text-left font-medium"
            >
              <Plus size={14} />
              Добавить в инбокс
            </button>
          )}
        </div>
      </div>
    </>
  );
}
