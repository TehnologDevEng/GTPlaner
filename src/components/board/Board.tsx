import { useRef } from 'react';
import { Column, Task } from '@/types';
import { BoardColumn } from './BoardColumn';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

const defaultCols: Column[] = [
  { id: 'focus', title: 'Главный фокус' },
  { id: 'tasks', title: 'Задачи дня' },
  { id: 'calls', title: 'Звонки и письма' },
  { id: 'habits', title: 'Трекер привычек' },
  { id: 'personal', title: 'Не забыть' },
];

interface Props {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (columnId: string, content: string) => void;
}

export function Board({ tasks, onToggleTask, onAddTask }: Props) {
  const { user } = useAuth();
  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru });
  const formattedToday = today.charAt(0).toUpperCase() + today.slice(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToColumn = (colId: string) => {
    const el = document.getElementById(`column-${colId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <header className="h-[60px] shrink-0 border-b border-[#222222] flex items-center justify-between px-6 md:px-8 bg-[#000000]/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-medium text-[#F7F8F8] tracking-tight">{formattedToday}</h1>
          <span className="text-[#333333]">/</span>
          <span className="text-[15px] text-[#8A8F98]">Ежедневник</span>
          {user && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          )}
        </div>

        {/* Quick jump tabs for iPad / tablet */}
        <div className="hidden lg:flex items-center gap-1.5">
          {defaultCols.map(c => (
            <button
              key={c.id}
              onClick={() => scrollToColumn(c.id)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[#161618] hover:bg-[#222] text-[#8A8F98] hover:text-[#F7F8F8] transition-colors border border-[#262628]"
            >
              {c.title}
            </button>
          ))}
        </div>
      </header>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-6 h-full items-start px-6 md:px-8 py-6 w-max">
          {defaultCols.map(col => (
            <div key={col.id} id={`column-${col.id}`}>
              <BoardColumn 
                column={col} 
                tasks={tasks.filter(t => t.columnId === col.id)}
                onToggleTask={onToggleTask}
                onAddTask={onAddTask}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
