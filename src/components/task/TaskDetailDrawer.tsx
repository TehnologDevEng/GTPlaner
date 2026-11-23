import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Flame,
  Flag,
  Folder,
  Timer,
  FileText,
  ListChecks,
} from 'lucide-react';
import { CustomColumnTitles, Subtask, Task, TaskPriority } from '@/types';
import { BOARD_COLUMNS, COLUMN_META, getColumnTitle } from '@/constants/columns';

interface Props {
  task: Task | null;
  customColumnTitles: CustomColumnTitles;
  onClose: () => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onStartFocus: (task: { id: string; content: string }) => void;
}

const PRIORITIES: { id: TaskPriority | 'none'; label: string; dot: string }[] = [
  { id: 'none', label: 'Обычный', dot: 'bg-[#555]' },
  { id: 'low', label: 'Низкий', dot: 'bg-sky-400' },
  { id: 'medium', label: 'Средний', dot: 'bg-amber-400' },
  { id: 'high', label: 'Высокий', dot: 'bg-rose-500' },
];

export const TaskDetailDrawer: React.FC<Props> = ({
  task,
  customColumnTitles,
  onClose,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onStartFocus,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.content);
      setNotes(task.notes || '');
      setNewSubtask('');
    }
  }, [task?.id]);

  useEffect(() => {
    if (!task) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [task, onClose]);

  if (!task) return null;

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.checked).length;

  const commitTitle = () => {
    const clean = title.trim();
    if (clean && clean !== task.content) {
      onUpdateTask(task.id, { content: clean });
    } else if (!clean) {
      setTitle(task.content);
    }
  };

  const commitNotes = () => {
    if (notes !== (task.notes || '')) {
      onUpdateTask(task.id, { notes: notes.trim() || undefined });
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSubtask.trim();
    if (!clean || subtasks.length >= 30) return;
    const next: Subtask[] = [
      ...subtasks,
      { id: `sub-${Date.now()}`, content: clean.slice(0, 300), checked: false },
    ];
    onUpdateTask(task.id, { subtasks: next });
    setNewSubtask('');
  };

  const handleToggleSubtask = (subId: string) => {
    const next = subtasks.map((s) => (s.id === subId ? { ...s, checked: !s.checked } : s));
    onUpdateTask(task.id, { subtasks: next });
  };

  const handleDeleteSubtask = (subId: string) => {
    const next = subtasks.filter((s) => s.id !== subId);
    onUpdateTask(task.id, { subtasks: next });
  };

  const handlePriorityChange = (p: TaskPriority | 'none') => {
    onUpdateTask(task.id, { priority: p === 'none' ? undefined : p });
  };

  const handleColumnChange = (colId: string) => {
    onUpdateTask(task.id, { columnId: colId });
  };

  const allTargetColumns = [
    ...BOARD_COLUMNS.map((c) => ({ id: c.id, title: getColumnTitle(c.id, customColumnTitles) })),
    { id: 'inbox', title: 'Инбокс' },
  ];

  const colMeta = COLUMN_META[task.columnId] || COLUMN_META.tasks;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0E0E10] border-l border-[#222226] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Top bar */}
        <div className="h-[60px] shrink-0 px-5 border-b border-[#222226] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#8A8F98] min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${colMeta.dotColor}`} />
            <span className="truncate">{getColumnTitle(task.columnId, customColumnTitles)}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {task.columnId !== 'archive' && (
              <button
                onClick={() => {
                  onStartFocus({ id: task.id, content: task.content });
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#00BCC5] hover:bg-[#00BCC5]/15 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Запустить 25-минутную сессию фокуса"
              >
                <Timer size={14} />
                <span>Фокус 25м</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1C1C20] rounded-lg transition-colors cursor-pointer"
              aria-label="Закрыть детали задачи"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Title & check toggle */}
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleTask(task.id)}
              className="mt-1.5 text-[#8A8F98] hover:text-[#00BCC5] transition-colors shrink-0 cursor-pointer"
              aria-label="Переключить выполнение"
            >
              {task.checked ? (
                <CheckCircle2 size={18} className="text-[#00BCC5]" />
              ) : (
                <Circle size={18} strokeWidth={2.2} />
              )}
            </button>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitTitle();
                  (e.target as HTMLTextAreaElement).blur();
                }
              }}
              rows={2}
              maxLength={500}
              className={`flex-1 bg-transparent text-base font-medium leading-snug tracking-tight resize-none outline-none border border-transparent focus:border-[#2C2C32] focus:bg-[#141417] rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors ${
                task.checked ? 'text-[#666] line-through' : 'text-[#F7F8F8]'
              }`}
              placeholder="Название задачи..."
            />
          </div>

          {/* Habit streak callout (if habit) */}
          {task.columnId === 'habits' && (
            <div className="flex items-center justify-between px-4 py-3 bg-[#141418] border border-[#26262C] rounded-xl">
              <div className="flex items-center gap-2.5">
                <Flame size={18} className="text-amber-400" />
                <div>
                  <p className="text-xs font-medium text-[#F7F8F8]">Текущая серия</p>
                  <p className="text-[11px] text-[#8A8F98]">
                    Сбрасывается автоматически каждое утро
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-amber-400 tabular-nums">
                {task.streak || 0} дн.
              </span>
            </div>
          )}

          {/* Properties: Column & Priority */}
          <div className="space-y-4 pt-2 border-t border-[#1C1C20]">
            {/* Category / Column */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#8A8F98] flex items-center gap-1.5">
                <Folder size={13} />
                <span>Колонка</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {allTargetColumns.map((col) => {
                  const active = task.columnId === col.id;
                  const meta = COLUMN_META[col.id] || COLUMN_META.tasks;
                  return (
                    <button
                      key={col.id}
                      onClick={() => handleColumnChange(col.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1A1A20] border-[#00BCC5]/60 text-[#F7F8F8] font-medium'
                          : 'bg-[#121215] border-[#222226] text-[#8A8F98] hover:text-[#F7F8F8] hover:border-[#333]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotColor}`} />
                      <span className="truncate">{col.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#8A8F98] flex items-center gap-1.5">
                <Flag size={13} />
                <span>Приоритет</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map((p) => {
                  const active = (task.priority || 'none') === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePriorityChange(p.id)}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#1A1A20] border-[#00BCC5]/60 text-[#F7F8F8] font-medium'
                          : 'bg-[#121215] border-[#222226] text-[#8A8F98] hover:text-[#F7F8F8] hover:border-[#333]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.dot}`} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-2 border-t border-[#1C1C20]">
            <label className="text-xs text-[#8A8F98] flex items-center gap-1.5">
              <FileText size={13} />
              <span>Заметка</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={commitNotes}
              rows={4}
              maxLength={5000}
              placeholder="Добавьте контекст, ссылки или детали задачи..."
              className="w-full bg-[#141417] border border-[#242428] focus:border-[#00BCC5]/60 rounded-xl p-3 text-xs text-[#DEDEDE] placeholder-[#555] leading-relaxed outline-none resize-y transition-colors"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-2.5 pt-2 border-t border-[#1C1C20]">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#8A8F98] flex items-center gap-1.5">
                <ListChecks size={13} />
                <span>Подзадачи</span>
              </label>
              {subtasks.length > 0 && (
                <span className="text-xs text-[#8A8F98] tabular-nums">
                  {completedSubtasks}/{subtasks.length}
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="group flex items-center justify-between gap-2 px-3 py-2 bg-[#141417] border border-[#222226] rounded-lg"
                  >
                    <button
                      onClick={() => handleToggleSubtask(sub.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      {sub.checked ? (
                        <CheckCircle2 size={14} className="text-[#00BCC5] shrink-0" />
                      ) : (
                        <Circle size={14} className="text-[#666] hover:text-[#00BCC5] shrink-0" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          sub.checked ? 'text-[#555] line-through' : 'text-[#DEDEDE]'
                        }`}
                      >
                        {sub.content}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="p-1 text-[#555] hover:text-[#EA4335] opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label="Удалить подзадачу"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                maxLength={300}
                placeholder="Добавить подзадачу..."
                className="flex-1 bg-[#141417] border border-[#242428] focus:border-[#00BCC5]/60 rounded-lg px-3 py-2 text-xs text-[#F7F8F8] placeholder-[#555] outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim() || subtasks.length >= 30}
                className="p-2 bg-[#1C1C22] hover:bg-[#26262E] disabled:opacity-40 text-[#00BCC5] border border-[#2A2A32] rounded-lg transition-colors cursor-pointer"
                aria-label="Добавить подзадачу"
              >
                <Plus size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#222226] bg-[#0B0B0D] flex items-center justify-between">
          <button
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#EA4335] hover:bg-[#EA4335]/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Удалить задачу</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#F7F8F8] bg-[#1C1C22] hover:bg-[#26262E] border border-[#2E2E36] rounded-lg transition-colors cursor-pointer"
          >
            Готово
          </button>
        </div>
      </aside>
    </>
  );
};
