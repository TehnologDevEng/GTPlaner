import { cn } from '@/lib/utils';
import {
  Calendar,
  Command,
  Inbox,
  Settings,
  ListTodo,
  LayoutDashboard,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  Headphones,
  Play,
  Pause,
  Timer,
} from 'lucide-react';
import { UserProfile } from './UserProfile';
import { useGlobalAudio } from '@/context/AudioContext';
import { usePomodoro } from '@/context/PomodoroContext';

interface SidebarProps {
  currentView: 'board' | 'dashboard' | 'archive';
  setView: (view: 'board' | 'dashboard' | 'archive') => void;
  onToggleInbox: () => void;
  inboxCount: number;
  onOpenCommandMenu: () => void;
  onOpenSettings: () => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  currentView,
  setView,
  onToggleInbox,
  inboxCount,
  onOpenCommandMenu,
  onOpenSettings,
  syncStatus,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { isPlaying, station, togglePlay } = useGlobalAudio();
  const { isRunning, secondsLeft, toggleRunning } = usePomodoro();

  const pomoMins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const pomoSecs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <>
      {/* Desktop & Landscape iPad collapsible sidebar */}
      <aside
        className={cn(
          'hidden md:flex h-full bg-[#0E0E0F] border-r border-[#222222] flex-col pt-6 pb-4 shrink-0 transition-[width] duration-200 ease-out',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Brand header + collapse toggle */}
        <div
          className={cn(
            'mb-7 flex items-center text-[#F7F8F8]',
            isCollapsed ? 'justify-center px-2 flex-col gap-3' : 'justify-between px-5'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#00BCC5] flex items-center justify-center shadow-lg shadow-[#00BCC5]/20 shrink-0">
              <ListTodo size={18} className="text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-lg tracking-tight whitespace-nowrap">
                MYPLANER
              </span>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-[#666] hover:text-[#F7F8F8] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            aria-label={isCollapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
          >
            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Quick utilities: Command menu & Inbox with live badge */}
        <div className="px-2.5 mb-5 space-y-0.5">
          <button
            onClick={onOpenCommandMenu}
            title="Командное меню (⌘K)"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer group',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <Command size={16} className="group-hover:text-[#00BCC5] transition-colors shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">Командное меню</span>
                <kbd className="ml-auto text-[10px] font-medium border border-[#333] px-1.5 py-0.5 rounded text-[#8A8F98]">
                  ⌘K
                </kbd>
              </>
            )}
          </button>

          <button
            onClick={onToggleInbox}
            title={`Инбокс (${inboxCount})`}
            className={cn(
              'w-full relative flex items-center gap-3 px-3 py-2 text-sm text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer group',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <Inbox size={16} className="group-hover:text-[#00BCC5] transition-colors shrink-0" />
            {!isCollapsed ? (
              <>
                <span className="truncate">Инбокс</span>
                <div className="ml-auto flex items-center gap-1.5">
                  {inboxCount > 0 && (
                    <span className="text-[11px] font-semibold text-[#00BCC5] tabular-nums">
                      {inboxCount}
                    </span>
                  )}
                  <kbd className="text-[10px] font-medium border border-[#333] px-1.5 py-0.5 rounded text-[#8A8F98]">
                    I
                  </kbd>
                </div>
              </>
            ) : (
              inboxCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#00BCC5] text-[#000] text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {inboxCount > 9 ? '9+' : inboxCount}
                </span>
              )
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-5 mb-2">
            <h3 className="text-xs font-semibold text-[#8A8F98] tracking-wider uppercase">
              Планер 2026
            </h3>
          </div>
        )}

        {/* Main navigation */}
        <div className="px-2.5 flex-1 overflow-y-auto space-y-0.5">
          <button
            onClick={() => setView('dashboard')}
            title="Дашборд"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer',
              isCollapsed && 'justify-center px-0',
              currentView === 'dashboard'
                ? 'bg-[#1A1A1C] text-[#F7F8F8] font-medium'
                : 'text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C]'
            )}
          >
            <LayoutDashboard
              size={16}
              className={cn(
                'shrink-0',
                currentView === 'dashboard' ? 'text-[#00BCC5]' : isCollapsed ? 'text-[#8A8F98]' : 'text-[#555]'
              )}
            />
            {!isCollapsed && <span>Дашборд</span>}
          </button>

          <button
            onClick={() => setView('board')}
            title="Сегодня"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer',
              isCollapsed && 'justify-center px-0',
              currentView === 'board'
                ? 'bg-[#1A1A1C] text-[#F7F8F8] font-medium'
                : 'text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C]'
            )}
          >
            <Calendar
              size={16}
              className={cn(
                'shrink-0',
                currentView === 'board' ? 'text-[#00BCC5]' : isCollapsed ? 'text-[#8A8F98]' : 'text-[#555]'
              )}
            />
            {!isCollapsed && <span>Сегодня</span>}
          </button>

          <button
            onClick={() => setView('archive')}
            title="Архив"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer',
              isCollapsed && 'justify-center px-0',
              currentView === 'archive'
                ? 'bg-[#1A1A1C] text-[#F7F8F8] font-medium'
                : 'text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C]'
            )}
          >
            <Archive
              size={16}
              className={cn(
                'shrink-0',
                currentView === 'archive' ? 'text-[#00BCC5]' : isCollapsed ? 'text-[#8A8F98]' : 'text-[#555]'
              )}
            />
            {!isCollapsed && <span>Архив</span>}
          </button>
        </div>

        {/* Bottom persistent mini-controls + profile + settings */}
        <div className="px-2.5 mt-auto space-y-2 pt-3 border-t border-[#1C1C1E]">
          {/* Active Pomodoro mini-controller */}
          {isRunning && (
            <button
              onClick={toggleRunning}
              title="Пауза / Старт таймера фокуса"
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 bg-[#14181A] border border-[#00BCC5]/30 rounded-xl text-xs text-[#F7F8F8] hover:bg-[#1A2022] transition-colors cursor-pointer',
                isCollapsed && 'justify-center px-0'
              )}
            >
              <Timer size={14} className="text-[#00BCC5] shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="font-mono tabular-nums text-[#00BCC5] font-medium">
                    {pomoMins}:{pomoSecs}
                  </span>
                  <Pause size={12} className="ml-auto text-[#8A8F98]" />
                </>
              )}
            </button>
          )}

          {/* Persistent Lo-Fi Mini Player */}
          <button
            onClick={togglePlay}
            title={isPlaying ? `Пауза: ${station.name}` : `Включить ${station.name}`}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-xs transition-colors cursor-pointer',
              isPlaying
                ? 'bg-[#13191B] border-[#00BCC5]/35 text-[#F7F8F8]'
                : 'bg-[#141416] border-[#222226] text-[#8A8F98] hover:text-[#F7F8F8] hover:border-[#333]',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <Headphones
              size={14}
              className={cn('shrink-0', isPlaying ? 'text-[#00BCC5]' : 'text-[#777]')}
            />
            {!isCollapsed && (
              <>
                <span className="truncate flex-1 text-left">{station.name}</span>
                {isPlaying ? (
                  <Pause size={12} className="text-[#00BCC5] shrink-0" />
                ) : (
                  <Play size={12} className="text-[#777] shrink-0" />
                )}
              </>
            )}
          </button>

          {!isCollapsed && (
            <UserProfile syncStatus={syncStatus} onOpenSettings={onOpenSettings} />
          )}

          <button
            onClick={onOpenSettings}
            title="Настройки"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer group',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <Settings size={16} className="group-hover:text-[#00BCC5] transition-colors shrink-0" />
            {!isCollapsed && <span>Настройки</span>}
          </button>
        </div>
      </aside>

      {/* Mobile & Narrow Split View Bottom Navigation Bar (56px height) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0E0E10]/95 backdrop-blur-md border-t border-[#222226] z-30 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setView('board')}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 rounded-lg text-[10px] transition-colors cursor-pointer',
            currentView === 'board' ? 'text-[#00BCC5] font-medium' : 'text-[#8A8F98]'
          )}
        >
          <Calendar size={18} />
          <span>Сегодня</span>
        </button>

        <button
          onClick={() => setView('dashboard')}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 rounded-lg text-[10px] transition-colors cursor-pointer',
            currentView === 'dashboard' ? 'text-[#00BCC5] font-medium' : 'text-[#8A8F98]'
          )}
        >
          <LayoutDashboard size={18} />
          <span>Дашборд</span>
        </button>

        <button
          onClick={onToggleInbox}
          className="relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 rounded-lg text-[10px] text-[#8A8F98] active:text-[#00BCC5] transition-colors cursor-pointer"
        >
          <Inbox size={18} />
          <span>Инбокс</span>
          {inboxCount > 0 && (
            <span className="absolute top-1 right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#00BCC5] text-[#000] text-[9px] font-bold flex items-center justify-center tabular-nums">
              {inboxCount > 9 ? '9+' : inboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setView('archive')}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 rounded-lg text-[10px] transition-colors cursor-pointer',
            currentView === 'archive' ? 'text-[#00BCC5] font-medium' : 'text-[#8A8F98]'
          )}
        >
          <Archive size={18} />
          <span>Архив</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 rounded-lg text-[10px] text-[#8A8F98] active:text-[#00BCC5] transition-colors cursor-pointer"
        >
          <Settings size={18} />
          <span>Меню</span>
        </button>
      </nav>
    </>
  );
}
