import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Непредвиденная ошибка приложения',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#000000] text-[#F7F8F8] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#121214] border border-[#262628] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle size={20} />
              <h2 className="text-base font-semibold text-[#F7F8F8]">Произошла ошибка</h2>
            </div>
            <p className="text-xs text-[#8A8F98] leading-relaxed break-words">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#00BCC5] hover:bg-[#00A5AD] text-white rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Перезагрузить</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
