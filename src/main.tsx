import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Register PWA service worker if supported
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
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
