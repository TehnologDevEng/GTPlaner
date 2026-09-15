import React, { useState, useMemo } from 'react';
import { Task, Id } from '@/types';
import { 
  Archive as ArchiveIcon, 
  RotateCcw, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Inbox,
  Clock,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  tasks: Task[];
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onArchiveCompleted: () => void;
  onClearArchive: (olderThanDays?: number) => void;
}

const COLUMN_NAMES: Record<string, { title: string; color: string; bg: string }> = {
  focus: { title: 'Главный фокус', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/40' },
  tasks: { title: 'Задачи дня', color: 'text-[#00BCC5]', bg: 'bg-[#00BCC5]/10 border-[#00BCC5]/30' },
  habits: { title: 'Привычки', color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-800/40' },
  personal: { title: 'Личное', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/40' },
  inbox: { title: 'Инбокс', color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-800/40' },
};

export function Archive({
  tasks,
  onRestore,
  onDeletePermanently,
  onArchiveCompleted,
  onClearArchive,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  // All archived tasks
  const archivedTasks = useMemo(() => {
    return tasks.filter(t => t.columnId === 'archive');
  }, [tasks]);

  // Tasks still checked on the active board
  const completedOnBoardCount = useMemo(() => {
    return tasks.filter(t => t.checked && t.columnId !== 'archive').length;
  }, [tasks]);

  // Filtered archived tasks
  const filteredTasks = useMemo(() => {
    return archivedTasks.filter(task => {
      // 1. Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!task.content.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        const origin = task.originalColumnId || 'tasks';
        if (origin !== selectedCategory) {
          return false;
        }
      }

      // 3. Period filter
      if (selectedPeriod !== 'all' && task.archivedAt) {
        const taskDate = new Date(task.archivedAt).getTime();
        const now = Date.now();
        if (selectedPeriod === 'today') {
          const oneDay = 24 * 60 * 60 * 1000;
          if (now - taskDate > oneDay) return false;
        } else if (selectedPeriod === 'week') {
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (now - taskDate > sevenDays) return false;
        } else if (selectedPeriod === 'month') {
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (now - taskDate > thirtyDays) return false;
        }
      }

      return true;
    });
  }, [archivedTasks, searchQuery, selectedCategory, selectedPeriod]);

  // Group filtered tasks by Date label
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};

    filteredTasks.forEach(task => {
      let label = 'Ранее';
      if (task.archivedAt) {
        try {
          const date = new Date(task.archivedAt);
          if (isToday(date)) {
            label = 'Сегодня';
          } else if (isYesterday(date)) {
            label = 'Вчера';
          } else {
            label = format(date, 'd MMMM yyyy', { locale: ru });
          }
        } catch {
          label = 'Ранее';
        }
      } else if (task.completedAt) {
        try {
          const date = new Date(task.completedAt);
          if (isToday(date)) {
            label = 'Сегодня';
          } else if (isYesterday(date)) {
            label = 'Вчера';
          } else {
            label = format(date, 'd MMMM yyyy', { locale: ru });
          }
        } catch {
          label = 'Ранее';
        }
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(task);
    });

    return groups;
  }, [filteredTasks]);

  // Metrics
  const totalArchived = archivedTasks.length;
  const completedTodayCount = archivedTasks.filter(t => {
    if (!t.archivedAt && !t.completedAt) return false;
    try {
      const d = new Date(t.archivedAt || t.completedAt!);
      return isToday(d);
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-[#1C1C1E] bg-[#0A0A0B]/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00BCC5]/10 border border-[#00BCC5]/30 flex items-center justify-center text-[#00BCC5]">
              <ArchiveIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[#F7F8F8] tracking-tight">Архив выполненных задач</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#18181B] text-[#8A8F98] border border-[#262628]">
                  {totalArchived} в архиве
                </span>
              </div>
              <p className="text-xs text-[#8A8F98] mt-0.5">
                Структурированная история закрытых задач с возможностью быстрого поиска и возврата на доску
              </p>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-2.5">
            {completedOnBoardCount > 0 && (
              <button
                onClick={onArchiveCompleted}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F7F8F8] bg-[#00BCC5] hover:bg-[#00A5AD] active:scale-95 rounded-lg transition-all shadow-md shadow-[#00BCC5]/20"
              >
                <ArchiveIcon size={14} />
                <span>Архивировать выполненные с доски ({completedOnBoardCount})</span>
              </button>
            )}

            {confirmClear ? (
              <div className="flex items-center gap-1.5 bg-[#1C1212] border border-red-900/50 p-1 rounded-lg">
                <button
                  onClick={() => {
                    onClearArchive();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 font-medium"
                >
                  Очистить всё
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs text-[#8A8F98] hover:text-[#F7F8F8]"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={totalArchived === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8A8F98] hover:text-[#EA4335] hover:bg-[#1A1A1E] border border-[#262628] rounded-lg transition-colors disabled:opacity-30"
              >
                <Trash2 size={13} />
                <span>Очистить архив</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and filter toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
          {/* Search box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию задачи..."
              className="w-full bg-[#141416] border border-[#242426] focus:border-[#00BCC5]/50 rounded-xl pl-9 pr-8 py-2 text-xs text-[#F7F8F8] placeholder-[#555] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#666] hover:text-[#AAA]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Все категории' },
              { id: 'focus', label: 'Фокус' },
              { id: 'tasks', label: 'Задачи' },
              { id: 'habits', label: 'Привычки' },
              { id: 'personal', label: 'Личное' },
              { id: 'inbox', label: 'Инбокс' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-[#1E1E22] text-[#00BCC5] border-[#00BCC5]/40 shadow-sm'
                    : 'bg-[#141416] text-[#8A8F98] border-[#222224] hover:text-[#D1D5DB] hover:bg-[#1A1A1E]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="bg-[#141416] border border-[#242426] text-xs text-[#8A8F98] rounded-xl px-3 py-2 focus:outline-none focus:border-[#00BCC5]/50 shrink-0"
          >
            <option value="all">За все время</option>
            <option value="today">Только сегодня</option>
            <option value="week">За последние 7 дней</option>
            <option value="month">За последние 30 дней</option>
          </select>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 px-8 py-6 max-w-5xl w-full">
        {totalArchived === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#141416] border border-[#262628] flex items-center justify-center text-[#555]">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#F7F8F8]">Архив пока пуст</h3>
              <p className="text-xs text-[#8A8F98] mt-1.5 leading-relaxed">
                Выполняйте задачи на доске дня. В конце дня или по кнопке они автоматически переносятся сюда с сохранением даты и исходной категории.
              </p>
            </div>
            {completedOnBoardCount > 0 && (
              <button
                onClick={onArchiveCompleted}
                className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#00BCC5] hover:bg-[#00A5AD] rounded-xl transition-all shadow-md shadow-[#00BCC5]/20"
              >
                <ArchiveIcon size={14} />
                <span>Архивировать выполненные задачи ({completedOnBoardCount})</span>
              </button>
            )}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-[#8A8F98]">
            <p className="text-sm">Ничего не найдено по заданным фильтрам.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedPeriod('all'); }}
              className="mt-2 text-xs text-[#00BCC5] hover:underline"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(groupedTasks) as [string, Task[]][]).map(([dateLabel, groupTasks]) => (
              <section key={dateLabel} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#00BCC5]" />
                    <h2 className="text-xs font-semibold text-[#D1D5DB] tracking-wide uppercase">
                      {dateLabel}
                    </h2>
                  </div>
                  <span className="text-[11px] text-[#666]">
                    ({groupTasks.length} {groupTasks.length === 1 ? 'задача' : 'задач'})
                  </span>
                  <div className="flex-1 h-px bg-[#1C1C1F]" />
                </div>

                {/* Tasks in this group */}
                <div className="grid grid-cols-1 gap-2.5">
                  {groupTasks.map(task => {
                    const originKey = task.originalColumnId || 'tasks';
                    const categoryInfo = COLUMN_NAMES[originKey] || {
                      title: 'Задачи',
                      color: 'text-[#8A8F98]',
                      bg: 'bg-[#18181B] border-[#262628]',
                    };

                    let timeStr = '';
                    if (task.completedAt || task.archivedAt) {
                      try {
                        const d = new Date(task.completedAt || task.archivedAt!);
                        timeStr = format(d, 'HH:mm');
                      } catch {
                        timeStr = '';
                      }
                    }

                    return (
                      <div
                        key={task.id}
                        className="bg-[#141416] border border-[#222225] hover:border-[#333338] rounded-xl p-3.5 flex items-center justify-between gap-4 transition-all group shadow-sm"
                      >
                        {/* Task info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle2 size={16} className="text-[#00BCC5] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#8A8F98] line-through tracking-tight truncate group-hover:text-[#A0A5AE] transition-colors">
                              {task.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${categoryInfo.bg} ${categoryInfo.color}`}
                              >
                                {categoryInfo.title}
                              </span>
                              {timeStr && (
                                <span className="flex items-center gap-1 text-[10px] text-[#666]">
                                  <Clock size={10} />
                                  <span>{timeStr}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onRestore(task.id)}
                            title={`Вернуть в "${categoryInfo.title}"`}
                            className="flex items-center gap-1.5 text-xs text-[#00BCC5] hover:text-[#56D8DE] bg-[#00BCC5]/10 hover:bg-[#00BCC5]/20 border border-[#00BCC5]/30 px-3 py-1.5 rounded-lg font-medium transition-all"
                          >
                            <RotateCcw size={13} />
                            <span className="hidden sm:inline">Вернуть на доску</span>
                          </button>
                          <button
                            onClick={() => onDeletePermanently(task.id)}
                            title="Удалить навсегда"
                            className="p-1.5 text-[#666] hover:text-[#EA4335] hover:bg-[#1E1E22] rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
