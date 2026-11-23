import {
  Quote,
  Target,
  CheckCircle2,
  Circle,
  Zap,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Clock,
  Volume2,
  Loader2,
  X,
  Flame,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { FlipClock } from './FlipClock';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { useGlobalAudio, RADIO_STATIONS } from '@/context/AudioContext';
import { usePomodoro, POMODORO_DURATIONS, PomodoroMode } from '@/context/PomodoroContext';

const quotes = [
  { text: 'Секрет того, чтобы вырваться вперед, заключается в том, чтобы начать.', author: 'Марк Твен' },
  { text: 'Успех — это не окончательно, неудачи — это не фатально, значение имеет лишь мужество продолжать.', author: 'Уинстон Черчилль' },
  { text: 'Лучший способ предсказать будущее — создать его.', author: 'Питер Друкер' },
  { text: 'То, что не начато сегодня, не будет закончено завтра.', author: 'Иоганн Вольфганг фон Гете' },
  { text: 'Ваше время ограничено, не тратьте его, проживая чужую жизнь.', author: 'Стив Джобс' },
  { text: 'Единственный способ делать великие дела — любить то, что вы делаете.', author: 'Стив Джобс' },
  { text: 'То, что мы делаем сегодня, определяет то, кем мы станем завтра.', author: 'Марк Аврелий' },
  { text: 'Препятствие на пути становится самим путем.', author: 'Марк Аврелий' },
  { text: 'Сложнее всего начать действовать, все остальное зависит только от упорства.', author: 'Амелия Эрхарт' },
  { text: 'Не ждите. Время никогда не будет «идеальным».', author: 'Наполеон Хилл' },
  { text: 'Либо вы управляете днем, либо день управляет вами.', author: 'Джим Рон' },
  { text: 'Успех — это сумма небольших усилий, повторяющихся изо дня в день.', author: 'Роберт Коллиер' },
  { text: 'Дисциплина — это мост между целями и достижениями.', author: 'Джим Рон' },
  { text: 'Планы мало что значат, но планирование — это всё.', author: 'Уинстон Черчилль' },
];

interface Props {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
}

export function Dashboard({ tasks, onToggleTask, onSelectTask }: Props) {
  const [quote, setQuote] = useState(quotes[0]);
  const [clockTab, setClockTab] = useState<'clock' | 'pomodoro'>('clock');
  const [playerMode, setPlayerMode] = useState<'radio' | 'soundcloud'>('radio');

  const {
    isPlaying,
    isLoading,
    volume,
    station,
    error: audioError,
    togglePlay,
    setVolume,
    selectStation,
  } = useGlobalAudio();

  const {
    mode: pomoMode,
    secondsLeft,
    isRunning,
    focusedTask,
    completedSessions,
    setMode: setPomoMode,
    toggleRunning,
    resetTimer,
    startFocusOnTask,
    clearFocusedTask,
  } = usePomodoro();

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  // Automatically switch card to Pomodoro view when a task focus session starts
  useEffect(() => {
    if (isRunning || focusedTask) {
      setClockTab('pomodoro');
    }
  }, [isRunning, focusedTask]);

  const today = format(new Date(), 'd MMMM yyyy', { locale: ru });
  const hour = new Date().getHours();

  let greeting = 'Доброй ночи';
  if (hour >= 6 && hour < 12) greeting = 'Доброе утро';
  else if (hour >= 12 && hour < 18) greeting = 'Добрый день';
  else if (hour >= 18 && hour < 23) greeting = 'Добрый вечер';

  const boardTasks = tasks.filter((t) => t.columnId !== 'archive' && t.columnId !== 'inbox');
  const totalTasks = boardTasks.length;
  const completedTasks = boardTasks.filter((t) => t.checked).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const focusTasks = tasks.filter((t) => t.columnId === 'focus');
  const activeHabits = tasks.filter((t) => t.columnId === 'habits');
  const habitsDoneCount = activeHabits.filter((t) => t.checked).length;

  const pomoMins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const pomoSecs = String(secondsLeft % 60).padStart(2, '0');
  const totalPomoSeconds = POMODORO_DURATIONS[pomoMode].seconds;
  const pomoProgress = Math.round(((totalPomoSeconds - secondsLeft) / totalPomoSeconds) * 100);

  return (
    <div className="flex flex-col h-full bg-[#000000] px-4 py-6 sm:p-8 overflow-y-auto">
      <div className="flex items-baseline justify-between gap-3 mb-6 sm:mb-8 text-[#F7F8F8] max-w-4xl">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-signature text-4xl sm:text-[46px] leading-none text-[#F7F8F8] tracking-wide font-normal">
            {greeting}
          </h1>
          <span className="text-xs text-[#666] hidden sm:inline">{today}</span>
        </div>
        {completedSessions > 0 && (
          <span className="text-xs text-[#8A8F98] tabular-nums">
            Фокус-сессий сегодня: <strong className="text-[#00BCC5]">{completedSessions}</strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl pb-6">
        {/* Date / FlipClock & Pomodoro Timer Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col justify-between w-full overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[#8A8F98] text-xs uppercase tracking-wider">
              {clockTab === 'clock' ? today : 'Таймер фокуса'}
            </p>
            <div className="flex bg-[#0E0E0F] rounded-lg p-0.5 border border-[#26262A]">
              <button
                onClick={() => setClockTab('clock')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  clockTab === 'clock'
                    ? 'bg-[#222226] text-[#F7F8F8]'
                    : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                }`}
              >
                <Clock size={11} />
                <span>Часы</span>
              </button>
              <button
                onClick={() => setClockTab('pomodoro')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  clockTab === 'pomodoro'
                    ? 'bg-[#222226] text-[#00BCC5]'
                    : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                }`}
              >
                <Timer size={11} />
                <span>Фокус</span>
              </button>
            </div>
          </div>

          {clockTab === 'clock' ? (
            <div className="flex flex-col justify-center flex-1 py-2">
              <div className="w-full">
                <FlipClock />
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between flex-1 gap-3">
              {/* Mode selector */}
              <div className="flex items-center gap-1">
                {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPomoMode(m)}
                    className={`flex-1 py-1 text-[11px] rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      pomoMode === m
                        ? 'bg-[#00BCC5]/15 text-[#00BCC5] font-medium border border-[#00BCC5]/30'
                        : 'bg-[#101012] text-[#8A8F98] hover:text-[#F7F8F8] border border-transparent'
                    }`}
                  >
                    {POMODORO_DURATIONS[m].label}
                  </button>
                ))}
              </div>

              {/* Countdown display */}
              <div className="text-center py-1">
                <div className="text-5xl font-bold font-mono tabular-nums tracking-tight text-[#00BCC5]">
                  {pomoMins}:{pomoSecs}
                </div>
                {focusedTask && (
                  <div className="mt-2 inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg bg-[#1C1C20] border border-[#2A2A30] text-[11px] text-[#DEDEDE]">
                    <Target size={11} className="text-[#00BCC5] shrink-0" />
                    <span className="truncate">{focusedTask.content}</span>
                    <button
                      onClick={clearFocusedTask}
                      className="text-[#666] hover:text-[#F7F8F8] shrink-0 cursor-pointer"
                      aria-label="Снять фокус с задачи"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress line + controls */}
              <div className="space-y-2.5">
                <div className="w-full h-1 bg-[#222226] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00BCC5] transition-all duration-500"
                    style={{ width: `${pomoProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleRunning}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-[#00BCC5] hover:bg-[#00A5AD] text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {isRunning ? <Pause size={13} /> : <Play size={13} />}
                    <span>{isRunning ? 'Пауза' : 'Старт'}</span>
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-2 text-[#8A8F98] hover:text-[#F7F8F8] bg-[#202024] hover:bg-[#2A2A30] rounded-lg transition-colors cursor-pointer"
                    title="Сбросить таймер"
                    aria-label="Сбросить таймер"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task Progress Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-[#8A8F98] text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap size={14} className="text-[#00BCC5]" />
              <span>Продуктивность</span>
            </p>
            <div className="flex items-end gap-3 mt-4">
              <h2 className="text-5xl font-bold text-[#F7F8F8] tracking-tight tabular-nums">
                {progress}%
              </h2>
              <p className="text-[#8A8F98] pb-1 text-sm">выполнено</p>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-[13px] text-[#8A8F98] mt-2 tabular-nums">
              <span>
                {completedTasks} из {totalTasks} на доске
              </span>
              {activeHabits.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-400/90">
                    <Flame size={13} />
                    Привычки: {habitsDoneCount}/{activeHabits.length}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="w-full bg-[#222] h-2 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#C84638] via-[#C86A36] to-[#00BCC5]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Interactive Focus of the day */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 md:col-span-2">
          <p className="text-[#8A8F98] text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target size={14} className="text-[#00BCC5]" />
            <span>Главный фокус</span>
          </p>

          {focusTasks.length === 0 ? (
            <div className="py-3 flex items-center gap-3 text-[#666]">
              <CheckCircle2 size={20} className="text-[#00BCC5]" />
              <p className="text-sm">Задач в «Главном фокусе» пока нет — добавьте их на доске.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {focusTasks.map((task) => {
                const isFocusedNow = focusedTask?.id === task.id && isRunning;
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between gap-3 bg-[#1A1A1D] hover:bg-[#1F1F24] p-3.5 rounded-xl border transition-colors ${
                      isFocusedNow ? 'border-[#00BCC5]/50' : 'border-[#26262A]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-[#8A8F98] hover:text-[#00BCC5] transition-colors shrink-0 cursor-pointer"
                        aria-label="Отметить задачу"
                      >
                        {task.checked ? (
                          <CheckCircle2 size={17} className="text-[#00BCC5]" />
                        ) : (
                          <Circle size={17} strokeWidth={2.2} />
                        )}
                      </button>
                      <button
                        onClick={() => onSelectTask(task)}
                        className={`text-left text-[14px] font-medium tracking-tight leading-snug break-words cursor-pointer ${
                          task.checked ? 'text-[#555] line-through' : 'text-[#F7F8F8] hover:text-white'
                        }`}
                      >
                        {task.content}
                      </button>
                    </div>

                    {!task.checked && (
                      <button
                        onClick={() => {
                          startFocusOnTask({ id: task.id, content: task.content });
                          setClockTab('pomodoro');
                        }}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          isFocusedNow
                            ? 'bg-[#00BCC5] text-white'
                            : 'bg-[#222228] hover:bg-[#2C2C34] text-[#00BCC5] border border-[#2E2E36]'
                        }`}
                      >
                        <Timer size={12} />
                        <span>{isFocusedNow ? 'В фокусе' : 'Фокус 25м'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Activity Analytics */}
        <WeeklyActivityChart tasks={tasks} />

        {/* Persistent Lo-Fi Player Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col justify-between md:col-span-1 min-h-[220px]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#8A8F98] text-xs uppercase tracking-wider flex items-center gap-2">
              <Headphones size={14} className="text-[#00BCC5]" />
              <span>Lo-Fi Фокус</span>
            </p>
            <div className="flex bg-[#0E0E0F] rounded-lg p-0.5 border border-[#2A2A2A]">
              <button
                onClick={() => setPlayerMode('radio')}
                className={`text-[11px] px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  playerMode === 'radio'
                    ? 'bg-[#222] text-[#F7F8F8]'
                    : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                }`}
              >
                Радио
              </button>
              <button
                onClick={() => setPlayerMode('soundcloud')}
                className={`text-[11px] px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  playerMode === 'soundcloud'
                    ? 'bg-[#222] text-[#F7F8F8]'
                    : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                }`}
              >
                SoundCloud
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden bg-[#0E0E10] border border-[#222226] flex flex-col relative">
            {playerMode === 'radio' ? (
              <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-br from-[#141A1C] via-[#101012] to-[#0B0B0D]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={togglePlay}
                      className="w-11 h-11 rounded-full bg-[#00BCC5] hover:bg-[#00A5AD] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-lg shadow-[#00BCC5]/20 cursor-pointer"
                      aria-label={isPlaying ? 'Пауза' : 'Играть радио'}
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} className="ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-[#F7F8F8] font-medium text-sm truncate">
                        {station.name}
                      </h3>
                      <p className="text-[#8A8F98] text-[11px] truncate">
                        {isPlaying ? 'Играет в фоне на всех вкладках' : station.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Station switcher */}
                <div className="flex items-center gap-1.5 mt-3">
                  {RADIO_STATIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectStation(s.id)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] border transition-colors cursor-pointer truncate ${
                        station.id === s.id
                          ? 'bg-[#1D2426] border-[#00BCC5]/40 text-[#00BCC5] font-medium'
                          : 'bg-[#141417] border-[#242428] text-[#8A8F98] hover:text-[#F7F8F8]'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {/* Volume control */}
                <div className="flex items-center gap-2.5 mt-3 pt-2 border-t border-[#222226]">
                  <Volume2 size={14} className="text-[#8A8F98] shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-[#00BCC5] h-1 bg-[#28282E] rounded-lg cursor-pointer"
                    aria-label="Громкость радио"
                  />
                  <span className="text-[10px] font-mono tabular-nums text-[#8A8F98] w-7 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                {audioError && (
                  <p className="text-[11px] text-amber-400 mt-2">{audioError}</p>
                )}
              </div>
            ) : (
              <iframe
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/chillhopdotcom&color=%2300BCC5&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=true&visual=true"
                className="flex-1 min-h-[160px]"
                title="SoundCloud Chillhop Player"
              />
            )}
          </div>
        </div>

        {/* Quote Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 md:col-span-1 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
          <Quote size={110} className="absolute -top-4 -right-4 text-[#222] opacity-40 rotate-12 pointer-events-none" />
          <p className="text-[#8A8F98] text-xs uppercase tracking-wider mb-3 relative z-10">
            Цитата дня
          </p>
          <blockquote className="text-lg sm:text-xl font-medium text-[#DEDEDE] leading-relaxed relative z-10">
            «{quote.text}»
          </blockquote>
          <p className="font-signature text-[26px] leading-none text-[#00BCC5]/90 mt-4 relative z-10 text-right pr-1">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
