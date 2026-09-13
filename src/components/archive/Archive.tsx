import { Task } from '@/types';
import { Archive as ArchiveIcon, RotateCcw } from 'lucide-react';

export function Archive({ tasks, onRestore }: { tasks: Task[], onRestore: (id: string) => void }) {
  const archivedTasks = tasks.filter(t => t.columnId === 'archive');

  return (
    <div className="flex flex-col h-full bg-[#000000] p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8 text-[#F7F8F8]">
        <ArchiveIcon size={24} className="text-[#00BCC5]" />
        <h1 className="text-2xl font-semibold">Архив</h1>
      </div>
      
      <div className="max-w-3xl space-y-3">
        {archivedTasks.length === 0 ? (
          <p className="text-[#8A8F98]">Архив пуст. Сюда автоматически попадают выполненные задачи с прошлого дня.</p>
        ) : (
          archivedTasks.map(task => (
            <div key={task.id} className="bg-[#161618] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between group transition-colors hover:border-[#3A3A3A]">
              <p className="text-[14px] text-[#8A8F98] line-through font-medium tracking-tight">{task.content}</p>
              <button 
                onClick={() => onRestore(task.id)}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs text-[#00BCC5] hover:text-[#56D8DE] transition-all bg-[#00BCC5]/10 px-3 py-1.5 rounded-lg font-medium"
              >
                <RotateCcw size={14} />
                Вернуть на доску
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
