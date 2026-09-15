import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Cloud, 
  LogOut, 
  Loader2, 
  Archive, 
  Trash2, 
  Keyboard, 
  RefreshCw,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { Task } from '@/types';
import { getAuthErrorMessage, isInsideIframe } from '../../lib/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  tasks: Task[];
  onArchiveCompleted: () => void;
  onClearArchive: (olderThanDays?: number) => void;
  onForceSync: () => Promise<void>;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  syncStatus,
  tasks,
  onArchiveCompleted,
  onClearArchive,
  onForceSync,
}) => {
  const { user, signIn, signInRedirect, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'sync' | 'archive' | 'shortcuts'>('sync');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningInRedirect, setIsSigningInRedirect] = useState(false);
  const [authError, setAuthError] = useState<{
    title: string;
    message: string;
    code?: string;
    isIframe?: boolean;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const inIframe = isInsideIframe();

  if (!isOpen) return null;

  const completedOnBoardCount = tasks.filter(t => t.checked && t.columnId !== 'archive').length;
  const inArchiveCount = tasks.filter(t => t.columnId === 'archive').length;

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    setSyncSuccessMessage(null);
    try {
      await onForceSync();
      setSyncSuccessMessage('Все данные успешно сохранены в облаке!');
      setTimeout(() => setSyncSuccessMessage(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingManual(false);
    }
  };

  const handleSignInPopup = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (e: unknown) {
      const parsed = getAuthErrorMessage(e);
      setAuthError(parsed);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignInRedirectMode = async () => {
    setAuthError(null);
    setIsSigningInRedirect(true);
    try {
      await signInRedirect();
    } catch (e: unknown) {
      const parsed = getAuthErrorMessage(e);
      setAuthError(parsed);
    } finally {
      setIsSigningInRedirect(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(window.location.hostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-[#121214] border border-[#262628] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222224] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-medium text-[#F7F8F8]">Настройки MYPLANER</h2>
            {user && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Google подключен
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#1E1E22] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-[#1E1E20]">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'sync'
                ? 'border-[#00BCC5] text-[#F7F8F8]'
                : 'border-transparent text-[#8A8F98] hover:text-[#D1D5DB]'
            }`}
          >
            <Cloud size={15} />
            <span>Синхронизация устройств</span>
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'archive'
                ? 'border-[#00BCC5] text-[#F7F8F8]'
                : 'border-transparent text-[#8A8F98] hover:text-[#D1D5DB]'
            }`}
          >
            <Archive size={15} />
            <span>Управление архивом</span>
            {completedOnBoardCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#00BCC5]/20 text-[#00BCC5] rounded-full text-[10px]">
                {completedOnBoardCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'shortcuts'
                ? 'border-[#00BCC5] text-[#F7F8F8]'
                : 'border-transparent text-[#8A8F98] hover:text-[#D1D5DB]'
            }`}
          >
            <Keyboard size={15} />
            <span>Горячие клавиши</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Iframe advice banner if user not yet signed in */}
              {!user && inIframe && (
                <div className="p-3 bg-[#00BCC5]/10 border border-[#00BCC5]/20 rounded-xl flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#00BCC5]">
                      Окно предпросмотра (iframe)
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                      Браузеры блокируют окна авторизации Google внутри фреймов. Для быстрого и безошибочного входа откройте планер в отдельной вкладке:
                    </p>
                  </div>
                  <button
                    onClick={handleOpenInNewTab}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#00BCC5] hover:bg-[#00A5AD] text-white rounded-lg text-xs font-medium shadow-sm transition-all"
                  >
                    <ExternalLink size={13} />
                    <span>Открыть во вкладке</span>
                  </button>
                </div>
              )}

              {/* Account card */}
              <div className="p-4 bg-[#18181B] border border-[#2A2A2E] rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-[#00BCC5]/40"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#202024] text-[#00BCC5] flex items-center justify-center font-semibold text-base border border-[#333]">
                        {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-[#F7F8F8]">
                        {user ? user.displayName || 'Google-пользователь' : 'Гостевой режим (офлайн)'}
                      </h3>
                      <p className="text-xs text-[#8A8F98]">
                        {user ? user.email : 'Войдите для синхронизации с iPad, телефоном и ПК'}
                      </p>
                    </div>
                  </div>

                  {user ? (
                    <button
                      onClick={signOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#EA4335] hover:bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-lg transition-colors"
                    >
                      <LogOut size={13} />
                      <span>Выйти</span>
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <button
                        onClick={handleSignInPopup}
                        disabled={isSigningIn || isSigningInRedirect}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[#00BCC5] hover:bg-[#00A5AD] active:scale-[0.98] rounded-lg transition-all shadow-md shadow-[#00BCC5]/20 disabled:opacity-50"
                      >
                        {isSigningIn ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path
                              fill="#FFFFFF"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#FFFFFF"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FFFFFF"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#FFFFFF"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        )}
                        <span>Войти через Google</span>
                      </button>

                      {/* Fallback direct redirect button */}
                      <button
                        onClick={handleSignInRedirectMode}
                        disabled={isSigningIn || isSigningInRedirect}
                        title="Альтернативный способ входа без всплывающих окон (для Safari/iPad)"
                        className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#222226] border border-[#2E2E32] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSigningInRedirect ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <ArrowRight size={13} />
                        )}
                        <span>Вход через Redirect</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Detailed Error Diagnostic Card */}
                {authError && (
                  <div className="p-3.5 bg-red-950/30 border border-red-800/40 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-red-300">
                            {authError.title}
                          </h4>
                          {authError.code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-red-900/50 text-red-300 rounded">
                              {authError.code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-red-200/90 leading-relaxed">
                          {authError.message}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-red-900/40 flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleOpenInNewTab}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00BCC5] hover:bg-[#00A5AD] text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                      >
                        <ExternalLink size={13} />
                        <span>Открыть в новой вкладке</span>
                      </button>

                      <button
                        onClick={handleSignInRedirectMode}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#26262A] hover:bg-[#323238] text-[#F7F8F8] border border-[#3E3E44] rounded-lg text-xs font-medium transition-colors"
                      >
                        <ArrowRight size={13} />
                        <span>Попробовать Redirect</span>
                      </button>

                      {authError.code === 'auth/unauthorized-domain' && (
                        <button
                          onClick={handleCopyDomain}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F23] hover:bg-[#2A2A30] text-[#00BCC5] border border-[#00BCC5]/30 rounded-lg text-xs transition-colors"
                        >
                          {copiedDomain ? <Check size={13} /> : <Copy size={13} />}
                          <span>Скопировать домен ({window.location.hostname})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {user && (
                  <div className="pt-2 border-t border-[#262628] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8A8F98]">Статус подключения:</span>
                      {syncStatus === 'syncing' ? (
                        <span className="text-[#00BCC5] flex items-center gap-1 font-medium">
                          <Loader2 size={12} className="animate-spin" /> Синхронизируется...
                        </span>
                      ) : syncStatus === 'synced' ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> В сети (реальное время)
                        </span>
                      ) : (
                        <span className="text-amber-400">Ожидание подключения</span>
                      )}
                    </div>

                    <button
                      onClick={handleManualSync}
                      disabled={isSyncingManual}
                      className="flex items-center gap-1.5 text-xs text-[#8A8F98] hover:text-[#F7F8F8] bg-[#222226] hover:bg-[#2C2C32] px-2.5 py-1 rounded-md transition-colors"
                    >
                      <RefreshCw size={12} className={isSyncingManual ? 'animate-spin text-[#00BCC5]' : ''} />
                      <span>Синхронизировать сейчас</span>
                    </button>
                  </div>
                )}
                {syncSuccessMessage && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 px-3 py-1.5 rounded-md">
                    {syncSuccessMessage}
                  </p>
                )}
              </div>

              {/* How it works */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider">
                  Как работает синхронизация
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[#161618] border border-[#262628] rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#F7F8F8]">
                      <Smartphone size={14} className="text-[#00BCC5]" />
                      <span>iPad, Телефон и ПК</span>
                    </div>
                    <p className="text-[12px] text-[#8A8F98] leading-relaxed">
                      Войдите под одним Google-аккаунтом на iPad и телефоне — задачи обновляются мгновенно на всех экранах без перезагрузки.
                    </p>
                  </div>

                  <div className="p-3 bg-[#161618] border border-[#262628] rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#F7F8F8]">
                      <ShieldCheck size={14} className="text-[#00BCC5]" />
                      <span>Безопасность</span>
                    </div>
                    <p className="text-[12px] text-[#8A8F98] leading-relaxed">
                      Задачи хранятся в защищенной базе Google Firestore и изолированы по вашему персональному User ID.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#18181B] border border-[#2A2A2E] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-[#F7F8F8]">Архивация выполненных задач</h4>
                    <p className="text-xs text-[#8A8F98] mt-0.5">
                      На доске сейчас <span className="text-[#F7F8F8] font-semibold">{completedOnBoardCount}</span> завершенных задач.
                    </p>
                  </div>
                  <button
                    onClick={onArchiveCompleted}
                    disabled={completedOnBoardCount === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#00BCC5] hover:bg-[#00A5AD] disabled:opacity-40 disabled:hover:bg-[#00BCC5] rounded-lg transition-colors shadow-sm"
                  >
                    <Archive size={14} />
                    <span>Перенести в архив сейчас</span>
                  </button>
                </div>
                <p className="text-[12px] text-[#8A8F98] leading-relaxed border-t border-[#262628] pt-2">
                  💡 При наступлении нового дня выполненные задачи автоматически перемещаются в Архив с сохранением исходной категории и даты.
                </p>
              </div>

              {/* Clear archive */}
              <div className="p-4 bg-[#18181B] border border-[#2A2A2E] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-[#F7F8F8]">Очистить архив</h4>
                    <p className="text-xs text-[#8A8F98] mt-0.5">
                      Всего в архиве хранится: <span className="text-[#F7F8F8] font-semibold">{inArchiveCount}</span> задач
                    </p>
                  </div>

                  {confirmClear ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onClearArchive();
                          setConfirmClear(false);
                        }}
                        className="px-2.5 py-1 text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg hover:bg-red-950"
                      >
                        Да, удалить все
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="px-2.5 py-1 text-xs text-[#8A8F98] hover:text-[#F7F8F8]"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClear(true)}
                      disabled={inArchiveCount === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8A8F98] hover:text-[#EA4335] hover:bg-[#222] border border-[#333] rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      <span>Очистить весь архив</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider">
                Быстрые сочетания клавиш
              </h4>
              <div className="space-y-2">
                <div className="p-2.5 bg-[#18181B] border border-[#262628] rounded-xl flex items-center justify-between">
                  <span className="text-xs text-[#F7F8F8]">Открыть Командное меню</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-[#222226] border border-[#333] rounded text-[11px] text-[#8A8F98]">⌘</kbd>
                    <kbd className="px-2 py-0.5 bg-[#222226] border border-[#333] rounded text-[11px] text-[#8A8F98]">K</kbd>
                  </div>
                </div>

                <div className="p-2.5 bg-[#18181B] border border-[#262628] rounded-xl flex items-center justify-between">
                  <span className="text-xs text-[#F7F8F8]">Открыть / скрыть Инбокс</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-[#222226] border border-[#333] rounded text-[11px] text-[#8A8F98]">I</kbd>
                  </div>
                </div>

                <div className="p-2.5 bg-[#18181B] border border-[#262628] rounded-xl flex items-center justify-between">
                  <span className="text-xs text-[#F7F8F8]">Закрыть любое окно</span>
                  <kbd className="px-2 py-0.5 bg-[#222226] border border-[#333] rounded text-[11px] text-[#8A8F98]">Esc</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0E0E10] border-t border-[#222224] flex items-center justify-between">
          <div className="text-[11px] text-[#8A8F98] flex items-center gap-1.5">
            {inIframe && (
              <span className="text-amber-400/80">
                Совет: для лучшей работы на iPad откройте в Safari на весь экран
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#F7F8F8] bg-[#1E1E22] hover:bg-[#28282E] rounded-lg transition-colors border border-[#333]"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
