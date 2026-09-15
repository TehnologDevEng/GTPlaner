import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Command, Inbox, Settings, ListTodo, LayoutDashboard, Archive, Download } from 'lucide-react';
import { UserProfile } from './UserProfile';
import { usePWAInstall, PWAInstallModal } from '../pwa/PWAInstallModal';

interface SidebarProps {
  currentView: 'board' | 'dashboard' | 'archive';
  setView: (view: 'board' | 'dashboard' | 'archive') => void;
  onToggleInbox: () => void;
  onOpenCommandMenu: () => void;
  onOpenSettings: () => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
}

export function Sidebar({ 
  currentView, 
  setView, 
  onToggleInbox, 
  onOpenCommandMenu, 
  onOpenSettings, 
  syncStatus 
}: SidebarProps) {
  const { isInstallable, hasDeferredPrompt, isStandalone, isIOS, triggerInstall } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallClick = async () => {
    const res = await triggerInstall();
    if (res === 'ios' || res === 'unsupported') {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      <aside className="w-64 h-full bg-[#0E0E0F] border-r border-[#222222] flex flex-col pt-8 pb-4 shrink-0">
        <div className="px-5 mb-8 flex items-center justify-between text-[#F7F8F8]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#00BCC5] flex items-center justify-center shadow-lg shadow-[#00BCC5]/20">
              <ListTodo size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">MYPLANER</span>
          </div>

          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              title="Установить как приложение"
              className="p-1.5 text-[#8A8F98] hover:text-[#00BCC5] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer"
            >
              <Download size={15} />
            </button>
          )}
        </div>

        <div className="px-3 mb-6 space-y-0.5">
          <button 
            onClick={onOpenCommandMenu}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer group"
          >
            <Command size={16} className="group-hover:text-[#00BCC5] transition-colors" />
            <span>Командное меню</span>
            <kbd className="ml-auto text-[10px] font-medium border border-[#333] px-1.5 py-0.5 rounded text-[#8A8F98]">⌘K</kbd>
          </button>
          <button 
            onClick={onToggleInbox}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer group"
          >
            <Inbox size={16} className="group-hover:text-[#00BCC5] transition-colors" />
            <span>Инбокс</span>
            <kbd className="ml-auto text-[10px] font-medium border border-[#333] px-1.5 py-0.5 rounded text-[#8A8F98]">I</kbd>
          </button>
        </div>

        <div className="px-5 mb-2">
          <h3 className="text-xs font-semibold text-[#8A8F98] tracking-wider uppercase">Планер 2026</h3>
        </div>
        
        <div className="px-3 flex-1 overflow-y-auto space-y-0.5">
          <button
            onClick={() => setView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
              currentView === 'dashboard'
                ? "bg-[#1A1A1C] text-[#F7F8F8] font-medium" 
                : "text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C]"
            )}
          >
            <LayoutDashboard size={16} className={currentView === 'dashboard' ? "text-[#00BCC5]" : "text-transparent"} />
            <span>Дашборд</span>
          </button>
          <button
            onClick={() => setView('board')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
              currentView === 'board'
                ? "bg-[#1A1A1C] text-[#F7F8F8] font-medium" 
                : "text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C]"
            )}
          >
            <Calendar size={16} className={currentView === 'board' ? "text-[#00BCC5]" : "text-transparent"} />
            <span>Сегодня</span>
          </button>
          <button
            onClick={() => setView('archive')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
              currentView === 'archive'
                ? "bg-[#1A1A1C] text-[#F7F8F8] font-medium" 
                : "text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C]"
            )}
          >
            <Archive size={16} className={currentView === 'archive' ? "text-[#00BCC5]" : "text-transparent"} />
            <span>Архив</span>
          </button>
        </div>

        <div className="px-3 mt-auto space-y-2 pt-4 border-t border-[#1C1C1E]">
          {/* Quick Install Banner if not installed */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-[#00BCC5] hover:text-white bg-[#00BCC5]/10 hover:bg-[#00BCC5]/20 border border-[#00BCC5]/30 rounded-lg transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Download size={13} className="text-[#00BCC5] group-hover:scale-110 transition-transform" />
                <span>Установить на устройство</span>
              </span>
              <span className="text-[10px] opacity-75 font-mono">PWA</span>
            </button>
          )}

          <UserProfile syncStatus={syncStatus} onOpenSettings={onOpenSettings} />
          
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1A1A1C] rounded-lg transition-colors cursor-pointer group"
          >
            <Settings size={16} className="group-hover:text-[#00BCC5] transition-colors" />
            <span>Настройки</span>
          </button>
        </div>
      </aside>

      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        hasDeferredPrompt={hasDeferredPrompt}
        onPromptInstall={triggerInstall}
      />
    </>
  );
}
