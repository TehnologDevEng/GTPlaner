import { Column, Task } from '@/types';
import { BoardColumn } from './BoardColumn';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru });
  const formattedToday = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <header className="h-[60px] shrink-0 border-b border-[#222222] flex items-center px-8 bg-[#000000]/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-medium text-[#F7F8F8] tracking-tight">{formattedToday}</h1>
          <span className="text-[#333333]">/</span>
          <span className="text-[15px] text-[#8A8F98]">Ежедневник</span>
        </div>
      </header>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 h-full items-start px-8 py-6 w-max">
          {defaultCols.map(col => (
            <BoardColumn 
              key={col.id} 
              column={col} 
              tasks={tasks.filter(t => t.columnId === col.id)}
              onToggleTask={onToggleTask}
              onAddTask={onAddTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
