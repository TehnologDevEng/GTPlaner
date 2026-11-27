import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Register PWA service worker in production; unregister stale SW in dev
if ('serviceWorker' in navigator) {
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => reg.update().catch(() => {}))
        .catch((err) => {
          console.log('SW registration note:', err);
        });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AudioProvider>
          <PomodoroProvider>
            <App />
          </PomodoroProvider>
        </AudioProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
