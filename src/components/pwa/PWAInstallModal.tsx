import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Check, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone (PWA) mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async (): Promise<'prompted' | 'ios' | 'unsupported'> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return 'prompted';
    }

    if (isIOS) {
      return 'ios';
    }

    return 'unsupported';
  };

  return {
    isInstallable: Boolean(deferredPrompt) || isIOS,
    isStandalone,
    isIOS,
    triggerInstall,
  };
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onPromptInstall?: () => void;
}

export const PWAInstallModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  onPromptInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-[#141416] border border-[#28282C] rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#202024] rounded-lg transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#00BCC5] flex items-center justify-center shadow-lg shadow-[#00BCC5]/20 shrink-0">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F7F8F8]">Установка MYPLANER</h3>
            <p className="text-xs text-[#8A8F98]">Как полноценное приложение на рабочий стол</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-4">
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              На iPad и iPhone установка занимает 10 секунд и делает работу без рамок Safari:
            </p>
            <div className="space-y-2.5 bg-[#1C1C20] border border-[#2A2A30] p-3.5 rounded-xl text-xs">
              <div className="flex items-center gap-3 text-[#F7F8F8]">
                <div className="w-7 h-7 rounded-lg bg-[#28282E] flex items-center justify-center text-[#00BCC5] shrink-0">
                  <Share size={15} />
                </div>
                <span>1. Нажмите кнопку <strong>«Поделиться»</strong> в Safari</span>
              </div>
              <div className="flex items-center gap-3 text-[#F7F8F8]">
                <div className="w-7 h-7 rounded-lg bg-[#28282E] flex items-center justify-center text-[#00BCC5] shrink-0">
                  <PlusSquare size={15} />
                </div>
                <span>2. Прокрутите и выберите <strong>«На экран „Домой“»</strong></span>
              </div>
              <div className="flex items-center gap-3 text-[#F7F8F8]">
                <div className="w-7 h-7 rounded-lg bg-[#28282E] flex items-center justify-center text-emerald-400 shrink-0">
                  <Check size={15} />
                </div>
                <span>3. Нажмите <strong>«Добавить»</strong> в правом верхнем углу</span>
              </div>
            </div>
            <p className="text-[11px] text-[#8A8F98]">
              Иконка появится на рабочем столе iPad/iPhone и будет запускаться как нативная программа.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Установите MYPLANER на ваш компьютер или телефон, чтобы открывать его в отдельном быстром окне без браузерных вкладок.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onPromptInstall?.();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#00BCC5] hover:bg-[#00A5AD] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#00BCC5]/20 transition-all"
              >
                <Download size={14} />
                <span>Установить сейчас</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#222226] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-[#8A8F98] hover:text-[#F7F8F8] transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
