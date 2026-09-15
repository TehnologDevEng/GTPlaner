import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Command, 
  Calendar, 
  LayoutDashboard, 
  Archive, 
  Inbox, 
  Settings, 
  Plus, 
  CheckCircle2, 
  Circle, 
  RefreshCw, 
  ArrowRight 
} from 'lucide-react';
import { Task } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'board' | 'dashboard' | 'archive') => void;
  onToggleInbox: () => void;
  onOpenSettings: () => void;
  onAddTask: (columnId: string, content: string) => void;
  onToggleTask: (id: string) => void;
  onArchiveCompleted: () => void;
  onForceSync: () => Promise<void>;
  tasks: Task[];
}

export const CommandMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleInbox,
  onOpenSettings,
  onAddTask,
  onToggleTask,
  onArchiveCompleted,
  onForceSync,
  tasks,
}) => {
  const [query, setQuery] = useState('');
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setCreatingInColumn(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // If parent doesn't control directly, can be toggled
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTasks = query.trim()
    ? tasks.filter(t => t.content.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !creatingInColumn) return;
    onAddTask(creatingInColumn, query.trim());
    setQuery('');
    setCreatingInColumn(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="bg-[#121214] border border-[#2A2A2E] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-[#222224] gap-3">
          <Search size={18} className="text-[#8A8F98] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              creatingInColumn 
                ? `Введите текст новой задачи... (Enter для сохранения)`
                : "Поиск задачи или команда (⌘K)..."
            }
            className="flex-1 bg-transparent text-sm text-[#F7F8F8] placeholder-[#555] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && creatingInColumn) {
                handleCreateTask(e);
              }
            }}
          />
          {creatingInColumn && (
            <button
              onClick={() => setCreatingInColumn(null)}
              className="text-xs text-[#8A8F98] hover:text-[#F7F8F8] px-2 py-0.5 rounded bg-[#1C1C20]"
            >
              Отмена
            </button>
          )}
          <kbd className="text-[10px] text-[#8A8F98] border border-[#333] px-1.5 py-0.5 rounded">Esc</kbd>
        </div>

        {/* Content */}
        <div className="p-2 overflow-y-auto space-y-3">
          {/* If user is typing and wants to create new task */}
          {query.trim() && !creatingInColumn && (
            <div className="px-2 py-1">
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-2">
                Создать как новую задачу:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1.5">
                {[
                  { id: 'focus', label: 'В Главный фокус' },
                  { id: 'tasks', label: 'В Задачи дня' },
                  { id: 'habits', label: 'В Привычки' },
                  { id: 'personal', label: 'В Личное' },
                  { id: 'inbox', label: 'В Инбокс' },
                ].map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onAddTask(col.id, query.trim());
                      setQuery('');
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#8A8F98] hover:text-[#00BCC5] hover:bg-[#1A1A1E] rounded-lg border border-[#222] transition-colors text-left"
                  >
                    <Plus size={13} className="text-[#00BCC5] shrink-0" />
                    <span className="truncate">{col.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching tasks */}
          {filteredTasks.length > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-3">
                Найденные задачи ({filteredTasks.length})
              </span>
              {filteredTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onToggleTask(t.id)}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-[#1A1A1E] rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {t.checked ? (
                      <CheckCircle2 size={15} className="text-[#00BCC5] shrink-0" />
                    ) : (
                      <Circle size={15} className="text-[#555] group-hover:text-[#888] shrink-0" />
                    )}
                    <span className={`truncate text-[#D1D5DB] ${t.checked ? 'line-through text-[#666]' : ''}`}>
                      {t.content}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#666] bg-[#161618] px-2 py-0.5 rounded border border-[#262628] shrink-0">
                    {t.columnId === 'focus' ? 'Фокус' : t.columnId === 'habits' ? 'Привычка' : t.columnId === 'archive' ? 'Архив' : 'Задачи'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Standard navigation section */}
          {!query.trim() && (
            <>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-3">
                  Навигация по разделам
                </span>
                <button
                  onClick={() => { onNavigate('board'); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-[#00BCC5]" />
                    <span>Сегодня (Доска задач)</span>
                  </div>
                  <ArrowRight size={12} className="text-[#555]" />
                </button>

                <button
                  onClick={() => { onNavigate('dashboard'); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard size={15} className="text-[#00BCC5]" />
                    <span>Дашборд и аналитика</span>
                  </div>
                  <ArrowRight size={12} className="text-[#555]" />
                </button>

                <button
                  onClick={() => { onNavigate('archive'); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Archive size={15} className="text-[#00BCC5]" />
                    <span>Архив выполненных задач</span>
                  </div>
                  <ArrowRight size={12} className="text-[#555]" />
                </button>

                <button
                  onClick={() => { onToggleInbox(); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox size={15} className="text-[#00BCC5]" />
                    <span>Инбокс (Входящие идеи)</span>
                  </div>
                  <kbd className="text-[10px] text-[#777]">I</kbd>
                </button>
              </div>

              {/* Actions section */}
              <div className="space-y-0.5 pt-2 border-t border-[#1C1C20]">
                <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-3">
                  Быстрые действия
                </span>

                <button
                  onClick={() => {
                    onArchiveCompleted();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Archive size={15} className="text-[#8A8F98]" />
                    <span>Перенести выполненные задачи в архив</span>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    await onForceSync();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={15} className="text-[#8A8F98]" />
                    <span>Синхронизировать сейчас с облаком</span>
                  </div>
                </button>

                <button
                  onClick={() => { onOpenSettings(); onClose(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings size={15} className="text-[#8A8F98]" />
                    <span>Настройки и аккаунт Google</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
