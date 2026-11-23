import React from 'react';
import { RotateCcw, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

interface Props {
  toast: ToastItem | null;
  onDismiss: () => void;
}

export const Toast: React.FC<Props> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#16161A] border border-[#2C2C32] rounded-xl shadow-2xl shadow-black/80 text-xs text-[#F7F8F8]">
        <span className="whitespace-nowrap">{toast.message}</span>
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              onDismiss();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00BCC5]/15 hover:bg-[#00BCC5]/25 text-[#00BCC5] font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={12} />
            <span>{toast.undoLabel || 'Отменить'}</span>
          </button>
        )}
        <button
          onClick={onDismiss}
          className="p-1 text-[#666] hover:text-[#F7F8F8] transition-colors cursor-pointer"
          aria-label="Закрыть уведомление"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
