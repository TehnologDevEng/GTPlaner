import { useRef } from 'react';
import { BoardColumnId, CustomColumnTitles, Task } from '@/types';
import { BoardColumn } from './BoardColumn';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { usePomodoro } from '../../context/PomodoroContext';
import { getBoardColumns } from '@/constants/columns';
import { Timer, Pause, Play } from 'lucide-react';

interface Props {
  tasks: Task[];
  customColumnTitles: CustomColumnTitles;
  onToggleTask: (id: string) => void;
  onAddTask: (columnId: string, content: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onRenameColumn: (columnId: BoardColumnId, newTitle: string) => void;
}

export function Board({
  tasks,
  customColumnTitles,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
  onRenameColumn,
}: Props) {
  const { user } = useAuth();
  const { isRunning, secondsLeft, focusedTask, toggleRunning } = usePomodoro();
  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru });
  const formattedToday = today.charAt(0).toUpperCase() + today.slice(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const columns = getBoardColumns(customColumnTitles);

  const scrollToColumn = (colId: string) => {
    const el = document.getElementById(`column-${colId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const showActiveTimer = isRunning || focusedTask !== null;

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <header className="h-[60px] shrink-0 border-b border-[#222222] flex items-center justify-between gap-4 px-4 sm:px-6 md:px-8 bg-[#000000]/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-[15px] font-medium text-[#F7F8F8] tracking-tight truncate">
            {formattedToday}
          </h1>
          <span className="text-[#333333] hidden sm:inline">/</span>
          <span className="text-[14px] text-[#8A8F98] hidden sm:inline whitespace-nowrap">
            Ежедневник
          </span>
          {user && (
            <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] text-emerald-400/90 ml-2 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Синхронизация активна
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Active Pomodoro indicator when working on board */}
          {showActiveTimer && (
            <button
              onClick={toggleRunning}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#141418] border border-[#00BCC5]/40 text-xs text-[#F7F8F8] hover:bg-[#1B1B22] transition-colors cursor-pointer whitespace-nowrap"
              title={focusedTask ? `Фокус: ${focusedTask.content}` : 'Таймер фокуса'}
            >
              <Timer size={13} className="text-[#00BCC5]" />
              <span className="font-mono tabular-nums text-[#00BCC5] font-medium">
                {mins}:{secs}
              </span>
              {isRunning ? <Pause size={11} className="text-[#8A8F98]" /> : <Play size={11} className="text-[#8A8F98]" />}
            </button>
          )}

          {/* Quick jump tabs for iPad / desktop */}
          <div className="hidden lg:flex items-center gap-1.5">
            {columns.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToColumn(c.id)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-[#141416] hover:bg-[#202024] text-[#8A8F98] hover:text-[#F7F8F8] transition-colors border border-[#242428] whitespace-nowrap cursor-pointer"
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-5 sm:gap-6 h-full items-start px-4 sm:px-6 md:px-8 py-5 sm:py-6 w-max">
          {columns.map((col) => (
            <div key={col.id} id={`column-${col.id}`} className="h-full flex">
              <BoardColumn
                column={col}
                tasks={tasks.filter((t) => t.columnId === col.id)}
                onToggleTask={onToggleTask}
                onAddTask={onAddTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onSelectTask={onSelectTask}
                onRenameColumn={onRenameColumn}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
