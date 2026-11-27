import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Cloud, Loader2 } from 'lucide-react';

interface Props {
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline';
  onOpenSettings: () => void;
}

export const UserProfile: React.FC<Props> = ({ syncStatus, onOpenSettings }) => {
  const { user, loading } = useAuth();

  // Keep sidebar minimal when signed out — Google Sign-In lives inside Settings
  if (loading || !user) {
    return null;
  }

  return (
    <button
      onClick={onOpenSettings}
      className="w-full p-2 bg-[#141416] hover:bg-[#1A1A1E] border border-[#242426] hover:border-[#333] rounded-xl flex items-center justify-between gap-2 transition-all text-left group cursor-pointer"
      title="Управление синхронизацией и аккаунтом"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-[#00BCC5]/50 shrink-0"
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
            ) : syncStatus === 'offline' ? (
              <span className="text-[10px] text-amber-400">Офлайн</span>
            ) : (
              <span className="text-[10px] text-[#8A8F98]">Облако активно</span>
            )}
          </div>
        </div>
      </div>
      <Cloud size={14} className="text-[#666] group-hover:text-[#00BCC5] transition-colors shrink-0 mr-1" />
    </button>
  );
};
