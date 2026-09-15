import React from 'react';
import { Task } from '@/types';
import { GripVertical, Circle, CheckCircle2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  isOverlay?: boolean;
}

export const SortableTask: React.FC<Props> = ({ task, onToggle, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isOverlay ? attributes : {})} 
      {...(!isOverlay ? listeners : {})}
      className={`group relative bg-[#161618] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-xl p-3 transition-colors shadow-sm cursor-grab active:cursor-grabbing draggable-card touch-none select-none ${
        isDragging && !isOverlay ? 'opacity-30 scale-[0.98]' : 'opacity-100'
      } ${isOverlay ? 'shadow-2xl shadow-black/80 border-[#00BCC5]/50 scale-105 rotate-1 cursor-grabbing bg-[#1E1E22] ring-1 ring-[#00BCC5]/40' : ''}`}
    >
      <div 
        className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#555] opacity-50 group-hover:opacity-100 transition-opacity p-0.5"
      >
        <GripVertical size={13} />
      </div>
      <div className="flex items-start gap-2.5 pl-3.5">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className="mt-[2px] text-[#8A8F98] hover:text-[#00BCC5] transition-colors shrink-0"
        >
          {task.checked ? (
            <CheckCircle2 size={14} className="text-[#00BCC5]" />
          ) : (
            <Circle size={14} strokeWidth={2.5} />
          )}
        </button>
        <p className={`text-[13px] leading-snug font-medium tracking-tight mt-[1px] ${task.checked ? 'text-[#555] line-through' : 'text-[#DEDEDE]'}`}>
          {task.content}
        </p>
      </div>
    </div>
  );
}
