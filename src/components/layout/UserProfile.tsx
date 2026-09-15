import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Cloud, Loader2, User as UserIcon } from 'lucide-react';

interface Props {
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  onOpenSettings: () => void;
}

export const UserProfile: React.FC<Props> = ({ syncStatus, onOpenSettings }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#8A8F98]">
        <Loader2 size={13} className="animate-spin text-[#00BCC5]" />
        <span>Загрузка...</span>
      </div>
    );
  }

  return (
    <button
      onClick={onOpenSettings}
      className="w-full p-2 bg-[#141416] hover:bg-[#1A1A1E] border border-[#242426] hover:border-[#333] rounded-xl flex items-center justify-between gap-2 transition-all text-left group"
      title="Открыть настройки синхронизации"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-[#00BCC5]/50 shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#1E1E22] text-[#8A8F98] group-hover:text-[#00BCC5] flex items-center justify-center text-[10px] font-semibold shrink-0 border border-[#333]">
            {user ? (user.displayName?.[0] || 'U').toUpperCase() : <UserIcon size={12} />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-[#D1D5DB] group-hover:text-[#F7F8F8] truncate leading-tight">
            {user ? (user.displayName || user.email) : 'Гостевой режим'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {syncStatus === 'syncing' ? (
              <>
                <Loader2 size={9} className="text-[#00BCC5] animate-spin" />
                <span className="text-[10px] text-[#00BCC5]">Синхронизация...</span>
              </>
            ) : user && syncStatus === 'synced' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400">Облако активно</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                <span className="text-[10px] text-[#777]">Подключить Google</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Cloud size={14} className="text-[#666] group-hover:text-[#00BCC5] transition-colors shrink-0 mr-1" />
    </button>
  );
};
