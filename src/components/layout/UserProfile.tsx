import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Cloud, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  onOpenSettings: () => void;
}

export const UserProfile: React.FC<Props> = ({ syncStatus, onOpenSettings }) => {
  const { user, loading, signIn } = useAuth();
  const [isSigningInDirect, setIsSigningInDirect] = useState(false);

  const handleDirectGoogleLogin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSigningInDirect(true);
    try {
      await signIn();
    } catch (err) {
      console.warn('Direct sign-in triggered settings modal for guidance:', err);
      onOpenSettings();
    } finally {
      setIsSigningInDirect(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#8A8F98]">
        <Loader2 size={13} className="animate-spin text-[#00BCC5]" />
        <span>Загрузка профиля...</span>
      </div>
    );
  }

  // If user is already logged in with Google
  if (user) {
    return (
      <button
        onClick={onOpenSettings}
        className="w-full p-2 bg-[#141416] hover:bg-[#1A1A1E] border border-[#242426] hover:border-[#333] rounded-xl flex items-center justify-between gap-2 transition-all text-left group"
        title="Управление синхронизацией и аккаунтом"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-[#00BCC5]/60 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#1E1E22] text-[#00BCC5] flex items-center justify-center text-xs font-semibold shrink-0 border border-[#333]">
              {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[#D1D5DB] group-hover:text-[#F7F8F8] truncate leading-tight">
              {user.displayName || user.email}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {syncStatus === 'syncing' ? (
                <>
                  <Loader2 size={10} className="text-[#00BCC5] animate-spin" />
                  <span className="text-[10px] text-[#00BCC5]">Синхронизация...</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Облако синхронизировано</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Cloud size={14} className="text-[#666] group-hover:text-[#00BCC5] transition-colors shrink-0 mr-1" />
      </button>
    );
  }

  // Not logged in -> Clean, inviting Google Sign-in card
  return (
    <div className="space-y-1.5">
      <button
        onClick={handleDirectGoogleLogin}
        disabled={isSigningInDirect}
        className="w-full p-2.5 bg-gradient-to-r from-[#18181C] to-[#121214] hover:from-[#202026] hover:to-[#18181E] border border-[#2E2E34] hover:border-[#00BCC5]/50 rounded-xl flex items-center justify-between gap-2.5 transition-all text-left group shadow-sm disabled:opacity-60 cursor-pointer"
        title="Нажмите, чтобы включить синхронизацию задач через Google"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#222228] group-hover:bg-[#2A2A32] flex items-center justify-center shrink-0 border border-[#333] transition-colors">
            {isSigningInDirect ? (
              <Loader2 size={14} className="animate-spin text-[#00BCC5]" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#F7F8F8] group-hover:text-[#00BCC5] leading-tight transition-colors">
              Войти через Google
            </p>
            <p className="text-[10px] text-[#8A8F98] truncate mt-0.5">
              Синхронизация iPad и ПК
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};
