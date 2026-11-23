import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export const POMODORO_DURATIONS: Record<PomodoroMode, { label: string; seconds: number }> = {
  focus: { label: 'Фокус', seconds: 25 * 60 },
  shortBreak: { label: 'Перерыв', seconds: 5 * 60 },
  longBreak: { label: 'Длинный', seconds: 15 * 60 },
};

interface FocusedTaskRef {
  id: string;
  content: string;
}

interface PomodoroContextType {
  mode: PomodoroMode;
  secondsLeft: number;
  isRunning: boolean;
  focusedTask: FocusedTaskRef | null;
  completedSessions: number;
  setMode: (mode: PomodoroMode) => void;
  toggleRunning: () => void;
  resetTimer: () => void;
  startFocusOnTask: (task: FocusedTaskRef) => void;
  clearFocusedTask: () => void;
}

const PomodoroContext = createContext<PomodoroContextType>({
  mode: 'focus',
  secondsLeft: 25 * 60,
  isRunning: false,
  focusedTask: null,
  completedSessions: 0,
  setMode: () => {},
  toggleRunning: () => {},
  resetTimer: () => {},
  startFocusOnTask: () => {},
  clearFocusedTask: () => {},
});

function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 soft chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.14 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.65);
    });
  } catch {
    // Ignore audio context restrictions
  }
}

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATIONS.focus.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [focusedTask, setFocusedTask] = useState<FocusedTaskRef | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          playCompletionChime();
          if (mode === 'focus') {
            setCompletedSessions((c) => c + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const setMode = (nextMode: PomodoroMode) => {
    setIsRunning(false);
    setModeState(nextMode);
    setSecondsLeft(POMODORO_DURATIONS[nextMode].seconds);
  };

  const toggleRunning = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(POMODORO_DURATIONS[mode].seconds);
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(POMODORO_DURATIONS[mode].seconds);
  };

  const startFocusOnTask = (task: FocusedTaskRef) => {
    setFocusedTask(task);
    setModeState('focus');
    setSecondsLeft(POMODORO_DURATIONS.focus.seconds);
    setIsRunning(true);
  };

  const clearFocusedTask = () => {
    setFocusedTask(null);
  };

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        secondsLeft,
        isRunning,
        focusedTask,
        completedSessions,
        setMode,
        toggleRunning,
        resetTimer,
        startFocusOnTask,
        clearFocusedTask,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => useContext(PomodoroContext);
