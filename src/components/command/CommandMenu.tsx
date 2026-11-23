import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Calendar,
  LayoutDashboard,
  Archive,
  Inbox,
  Settings,
  Plus,
  CheckCircle2,
  Circle,
  RefreshCw,
  ArrowRight,
  Timer,
} from 'lucide-react';
import { CustomColumnTitles, Task } from '@/types';
import { BOARD_COLUMNS, getColumnTitle } from '@/constants/columns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'board' | 'dashboard' | 'archive') => void;
  onToggleInbox: () => void;
  onOpenSettings: () => void;
  onAddTask: (columnId: string, content: string) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onArchiveCompleted: () => void;
  onForceSync: () => Promise<void>;
  customColumnTitles: CustomColumnTitles;
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
  onSelectTask,
  onArchiveCompleted,
  onForceSync,
  customColumnTitles,
  tasks,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    ? tasks.filter(
        (t) =>
          t.content.toLowerCase().includes(query.toLowerCase()) ||
          (t.notes || '').toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const createTargets = [
    ...BOARD_COLUMNS.map((c) => ({
      id: c.id,
      label: `В «${getColumnTitle(c.id, customColumnTitles)}»`,
    })),
    { id: 'inbox', label: 'В «Инбокс»' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[12vh] p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-[#121214] border border-[#2A2A2E] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-[#222224] gap-3">
          <Search size={17} className="text-[#8A8F98] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск задачи или быстрая команда (⌘K)..."
            className="flex-1 bg-transparent text-sm text-[#F7F8F8] placeholder-[#555] focus:outline-none"
          />
          <kbd className="text-[10px] text-[#8A8F98] border border-[#333] px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>

        {/* Content */}
        <div className="p-2 overflow-y-auto space-y-3">
          {/* Quick-create task into any column */}
          {query.trim() && (
            <div className="px-2 py-1">
              <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-2">
                Создать задачу
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1.5">
                {createTargets.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onAddTask(col.id, query.trim());
                      setQuery('');
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#8A8F98] hover:text-[#00BCC5] hover:bg-[#1A1A1E] rounded-lg border border-[#222] transition-colors text-left cursor-pointer"
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
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-[#1A1A1E] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTask(t.id)}
                      className="shrink-0 cursor-pointer"
                      aria-label="Переключить статус"
                    >
                      {t.checked ? (
                        <CheckCircle2 size={15} className="text-[#00BCC5]" />
                      ) : (
                        <Circle size={15} className="text-[#555] group-hover:text-[#888]" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        onSelectTask(t);
                        onClose();
                      }}
                      className={`truncate text-left text-[#D1D5DB] hover:text-white cursor-pointer flex-1 ${
                        t.checked ? 'line-through text-[#666]' : ''
                      }`}
                    >
                      {t.content}
                    </button>
                  </div>
                  <span className="text-[11px] text-[#777] shrink-0">
                    {getColumnTitle(t.columnId, customColumnTitles)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Standard navigation */}
          {!query.trim() && (
            <>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-3">
                  Навигация
                </span>
                <button
                  onClick={() => {
                    onNavigate('board');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-[#00BCC5]" />
                    <span>Сегодня (Доска задач)</span>
                  </div>
                  <ArrowRight size={12} className="text-[#555]" />
                </button>

                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard size={15} className="text-[#00BCC5]" />
                    <span>Дашборд, Фокус-таймер и аналитика</span>
                  </div>
                  <ArrowRight size={12} className="text-[#555]" />
                </button>

                <button
                  onClick={() => {
                    onNavigate('archive');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Archive size={15} className="text-[#00BCC5]" />
                    <span>Архив выполненных задач</span>
                  </div>
                  <ArrowRight size={12} className="text-[#555]" />
                </button>

                <button
                  onClick={() => {
                    onToggleInbox();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox size={15} className="text-[#00BCC5]" />
                    <span>Инбокс (Входящие идеи)</span>
                  </div>
                  <kbd className="text-[10px] text-[#777]">I</kbd>
                </button>
              </div>

              <div className="space-y-0.5 pt-2 border-t border-[#1C1C20]">
                <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider px-3">
                  Действия
                </span>

                <button
                  onClick={() => {
                    onArchiveCompleted();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors cursor-pointer"
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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={15} className="text-[#8A8F98]" />
                    <span>Синхронизировать с облаком сейчас</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D1D5DB] hover:text-[#F7F8F8] hover:bg-[#1A1A1E] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings size={15} className="text-[#8A8F98]" />
                    <span>Настройки, аккаунт и тест синхронизации</span>
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
