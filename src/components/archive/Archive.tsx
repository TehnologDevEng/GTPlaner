import React, { useState, useMemo } from 'react';
import { CustomColumnTitles, Task } from '@/types';
import {
  Archive as ArchiveIcon,
  RotateCcw,
  Trash2,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { BOARD_COLUMNS, COLUMN_META, getColumnTitle } from '@/constants/columns';

interface Props {
  tasks: Task[];
  customColumnTitles: CustomColumnTitles;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onArchiveCompleted: () => void;
  onClearArchive: (olderThanDays?: number) => void;
}

export function Archive({
  tasks,
  customColumnTitles,
  onRestore,
  onDeletePermanently,
  onArchiveCompleted,
  onClearArchive,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const archivedTasks = useMemo(() => {
    return tasks.filter((t) => t.columnId === 'archive');
  }, [tasks]);

  // Exclude habits since habits reset daily instead of archiving
  const completedOnBoardCount = useMemo(() => {
    return tasks.filter((t) => t.checked && t.columnId !== 'archive' && t.columnId !== 'habits').length;
  }, [tasks]);

  const categoryFilters = useMemo(
    () => [
      { id: 'all', label: 'Все' },
      ...BOARD_COLUMNS.map((c) => ({
        id: c.id,
        label: getColumnTitle(c.id, customColumnTitles),
      })),
      { id: 'inbox', label: 'Инбокс' },
    ],
    [customColumnTitles]
  );

  const filteredTasks = useMemo(() => {
    return archivedTasks.filter((task) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inContent = task.content.toLowerCase().includes(query);
        const inNotes = (task.notes || '').toLowerCase().includes(query);
        if (!inContent && !inNotes) return false;
      }

      if (selectedCategory !== 'all') {
        const origin = task.originalColumnId || 'tasks';
        if (origin !== selectedCategory) return false;
      }

      if (selectedPeriod !== 'all') {
        const raw = task.archivedAt || task.completedAt;
        if (raw) {
          const taskDate = new Date(raw).getTime();
          const now = Date.now();
          if (selectedPeriod === 'today' && now - taskDate > 24 * 60 * 60 * 1000) return false;
          if (selectedPeriod === 'week' && now - taskDate > 7 * 24 * 60 * 60 * 1000) return false;
          if (selectedPeriod === 'month' && now - taskDate > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });
  }, [archivedTasks, searchQuery, selectedCategory, selectedPeriod]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const sorted = [...filteredTasks].sort((a, b) => {
      const aTime = new Date(a.archivedAt || a.completedAt || 0).getTime();
      const bTime = new Date(b.archivedAt || b.completedAt || 0).getTime();
      return bTime - aTime;
    });

    sorted.forEach((task) => {
      let label = 'Ранее';
      const raw = task.archivedAt || task.completedAt;
      if (raw) {
        try {
          const date = new Date(raw);
          if (isToday(date)) label = 'Сегодня';
          else if (isYesterday(date)) label = 'Вчера';
          else label = format(date, 'd MMMM yyyy', { locale: ru });
        } catch {
          label = 'Ранее';
        }
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(task);
    });

    return groups;
  }, [filteredTasks]);

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      return format(new Date(iso), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      {/* Header */}
      <header className="shrink-0 border-b border-[#222222] px-4 sm:px-6 md:px-8 py-4 sm:py-5 bg-[#000000]/80 backdrop-blur-md z-10 sticky top-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00BCC5]/10 border border-[#00BCC5]/30 flex items-center justify-center text-[#00BCC5]">
              <ArchiveIcon size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2.5">
                <h1 className="text-base font-semibold text-[#F7F8F8] tracking-tight">Архив задач</h1>
                <span className="font-signature text-[21px] leading-none text-[#00BCC5]/85 hidden sm:inline">
                  история дней
                </span>
              </div>
              <p className="text-xs text-[#8A8F98] tabular-nums">
                {archivedTasks.length > 0
                  ? `Сохранено в истории: ${archivedTasks.length}`
                  : 'Выполненные задачи структурируются по дням'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {completedOnBoardCount > 0 && (
              <button
                onClick={onArchiveCompleted}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F7F8F8] bg-[#00BCC5] hover:bg-[#00A5AD] active:scale-95 rounded-lg transition-all shadow-md shadow-[#00BCC5]/20 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 size={14} />
                <span>Архивировать выполненные ({completedOnBoardCount})</span>
              </button>
            )}

            {archivedTasks.length > 0 && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-800/40 px-2.5 py-1 rounded-lg">
                    <span className="text-[11px] text-red-300">Удалить всё?</span>
                    <button
                      onClick={() => {
                        onClearArchive();
                        setConfirmClear(false);
                      }}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-300 underline px-1 cursor-pointer"
                    >
                      Да
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="text-[11px] text-[#8A8F98] hover:text-[#F7F8F8] px-1 cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8A8F98] hover:text-[#EA4335] hover:bg-[#1A1A1E] border border-[#28282C] rounded-lg transition-colors cursor-pointer"
                    title="Очистить весь архив"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Очистить</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        {archivedTasks.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по архиву..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#121214] border border-[#262628] focus:border-[#00BCC5]/60 rounded-lg text-xs text-[#F7F8F8] placeholder-[#555] focus:outline-none transition-colors"
              />
            </div>

            {/* Category filter tabs */}
            <div className="flex items-center gap-1 bg-[#121214] p-1 rounded-lg border border-[#242426] overflow-x-auto max-w-full">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#222226] text-[#F7F8F8] font-medium shadow-sm'
                      : 'text-[#8A8F98] hover:text-[#D1D5DB]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Period selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'all' | 'today' | 'week' | 'month')}
              className="bg-[#121214] border border-[#242426] text-[#D1D5DB] text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#00BCC5]/60 cursor-pointer"
            >
              <option value="all">За все время</option>
              <option value="today">За сегодня</option>
              <option value="week">За 7 дней</option>
              <option value="month">За 30 дней</option>
            </select>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 max-w-4xl w-full">
        {archivedTasks.length === 0 ? (
          <div className="h-[55vh] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#121214] border border-[#222226] flex items-center justify-center text-[#444]">
              <ArchiveIcon size={28} />
            </div>
            <h3 className="text-base font-medium text-[#D1D5DB]">Архив пока пуст</h3>
            <p className="text-xs text-[#777] leading-relaxed">
              Выполненные задачи на доске автоматически переносятся сюда при смене дня с сохранением даты и категории. Привычки остаются на доске и копят серию.
            </p>
            {completedOnBoardCount > 0 && (
              <button
                onClick={onArchiveCompleted}
                className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#00BCC5] hover:bg-[#00A5AD] rounded-xl transition-all shadow-md shadow-[#00BCC5]/20 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Перенести выполненные с доски ({completedOnBoardCount})</span>
              </button>
            )}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-[#8A8F98]">По вашему фильтру ничего не найдено</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedPeriod('all');
              }}
              className="mt-2 text-xs text-[#00BCC5] hover:underline cursor-pointer"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(groupedTasks) as [string, Task[]][]).map(([dateLabel, groupTasks]) => (
              <section key={dateLabel} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#00BCC5]" />
                    <h2 className="text-xs font-semibold text-[#D1D5DB] tracking-wide uppercase">
                      {dateLabel}
                    </h2>
                  </div>
                  <div className="h-[1px] flex-1 bg-[#1E1E22]" />
                  <span className="text-[11px] text-[#666] tabular-nums">
                    {groupTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupTasks.map((task) => {
                    const originId = task.originalColumnId || 'tasks';
                    const colMeta = COLUMN_META[originId] || COLUMN_META.tasks;
                    const colLabel = getColumnTitle(originId, customColumnTitles);
                    const timeStr = formatTime(task.completedAt || task.archivedAt);

                    return (
                      <div
                        key={task.id}
                        className="group bg-[#121214] border border-[#222226] hover:border-[#343438] rounded-xl p-3.5 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="mt-0.5 text-emerald-500/80 shrink-0">
                            <CheckCircle2 size={15} />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-sm text-[#A1A1AA] group-hover:text-[#D1D5DB] transition-colors line-through decoration-[#444] break-words">
                              {task.content}
                            </p>
                            <div className="flex items-center flex-wrap gap-2 text-[11px] text-[#666] tabular-nums">
                              <span className={`inline-flex items-center gap-1.5 ${colMeta.textColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${colMeta.dotColor}`} />
                                {colLabel}
                              </span>
                              {timeStr && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock size={10} />
                                    {timeStr}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onRestore(task.id)}
                            className="flex items-center gap-1.5 text-xs text-[#00BCC5] hover:text-[#56D8DE] bg-[#00BCC5]/10 hover:bg-[#00BCC5]/20 border border-[#00BCC5]/30 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap"
                            title={`Вернуть в «${colLabel}»`}
                          >
                            <RotateCcw size={13} />
                            <span className="hidden sm:inline">Вернуть</span>
                          </button>

                          <button
                            onClick={() => onDeletePermanently(task.id)}
                            className="p-1.5 text-[#555] hover:text-[#EA4335] hover:bg-[#EA4335]/10 rounded-lg transition-colors cursor-pointer"
                            title="Удалить навсегда"
                            aria-label="Удалить задачу навсегда"
                          >
                            <Trash2 size={15} />
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
