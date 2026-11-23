import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface RadioStation {
  id: string;
  name: string;
  subtitle: string;
  url: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'lofi',
    name: 'Chill Lofi Radio',
    subtitle: '24/7 Фокус-эфир',
    url: 'https://radiorecord.hostingradio.ru/lofi96.aacp',
  },
  {
    id: 'chillout',
    name: 'Deep Chillout',
    subtitle: 'Спокойный фон',
    url: 'https://radiorecord.hostingradio.ru/chillout96.aacp',
  },
];

interface AudioContextType {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  station: RadioStation;
  error: string | null;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  selectStation: (stationId: string) => void;
}

const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isLoading: false,
  volume: 0.7,
  station: RADIO_STATIONS[0],
  error: null,
  togglePlay: () => {},
  setVolume: () => {},
  selectStation: () => {},
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [station, setStation] = useState<RadioStation>(RADIO_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = volume;
    audioRef.current = audio;

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };
    const handleWaiting = () => {
      setIsLoading(true);
    };
    const handleError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setError('Не удалось подключиться к потоку. Попробуйте другую станцию.');
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setError(null);
      setIsLoading(true);
      if (audio.src !== station.url) {
        audio.src = station.url;
      }
      audio.play().catch((err) => {
        console.warn('Audio playback error:', err);
        setIsLoading(false);
        setIsPlaying(false);
        setError('Нажмите ещё раз, чтобы разрешить звук в браузере.');
      });
    }
  };

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const selectStation = (stationId: string) => {
    const next = RADIO_STATIONS.find((s) => s.id === stationId);
    if (!next) return;
    setStation(next);
    setError(null);
    const audio = audioRef.current;
    if (audio && isPlaying) {
      setIsLoading(true);
      audio.src = next.url;
      audio.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        isLoading,
        volume,
        station,
        error,
        togglePlay,
        setVolume,
        selectStation,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useGlobalAudio = () => useContext(AudioContext);
