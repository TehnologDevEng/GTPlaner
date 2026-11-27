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

  useEffect(() => {
    if (isRunning || focusedTask) {
      setClockTab('pomodoro');
    }
  }, [isRunning, focusedTask]);

  const rawDate = format(new Date(), 'EEEE, d MMMM', { locale: ru });
  const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
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
    <div className="h-full w-full bg-[#000000] overflow-y-auto">
      <div className="min-h-full w-full flex flex-col px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
        <div className="w-full max-w-[1040px] mx-auto my-auto space-y-6 sm:space-y-7 pb-8 md:pb-2">
          {/* Centered editorial header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <h1 className="font-signature text-[42px] sm:text-[52px] leading-none text-[#F7F8F8] tracking-wide font-normal text-balance">
                {greeting}
              </h1>
              <span className="text-[13px] text-[#7A7F88] font-normal">
                {formattedDate}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#7A7F88] tabular-nums">
              <span>
                Выполнено{' '}
                <strong className="text-[#D1D5DB] font-medium">
                  {completedTasks}/{totalTasks}
                </strong>
              </span>
              {completedSessions > 0 && (
                <>
                  <span aria-hidden="true" className="text-[#3A3A40]">·</span>
                  <span>
                    Фокус-сессий:{' '}
                    <strong className="text-[#00BCC5] font-medium">{completedSessions}</strong>
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Row 1: Clock / Pomodoro + Productivity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
            {/* Clock & Pomodoro Card */}
            <section className="lg:col-span-7 bg-[#121214] border border-[#222226] rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[248px]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-[13px] font-medium text-[#8A8F98]">
                  {clockTab === 'clock' ? 'Текущее время' : 'Таймер фокуса'}
                </h2>
                <div className="flex bg-[#0B0B0D] rounded-lg p-0.5 border border-[#222226]">
                  <button
                    onClick={() => setClockTab('clock')}
                    className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      clockTab === 'clock'
                        ? 'bg-[#1E1E22] text-[#F7F8F8] font-medium'
                        : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                    }`}
                  >
                    <Clock size={11} />
                    <span>Часы</span>
                  </button>
                  <button
                    onClick={() => setClockTab('pomodoro')}
                    className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      clockTab === 'pomodoro'
                        ? 'bg-[#1E1E22] text-[#00BCC5] font-medium'
                        : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                    }`}
                  >
                    <Timer size={11} />
                    <span>Фокус</span>
                  </button>
                </div>
              </div>

              {clockTab === 'clock' ? (
                <div className="flex-1 flex items-center justify-center py-3">
                  <FlipClock />
                </div>
              ) : (
                <div className="flex flex-col justify-between flex-1 gap-4">
                  <div className="flex items-center gap-1.5 bg-[#0B0B0D] p-1 rounded-lg border border-[#1E1E22]">
                    {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPomoMode(m)}
                        className={`flex-1 py-1.5 text-[11px] rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          pomoMode === m
                            ? 'bg-[#1E1E24] text-[#00BCC5] font-medium'
                            : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                        }`}
                      >
                        {POMODORO_DURATIONS[m].label}
                      </button>
                    ))}
                  </div>

                  <div className="text-center py-1">
                    <div className="text-5xl sm:text-6xl font-bold font-mono tabular-nums tracking-tight text-[#00BCC5]">
                      {pomoMins}:{pomoSecs}
                    </div>
                    {focusedTask && (
                      <div className="mt-2.5 inline-flex items-center gap-2 max-w-full text-xs text-[#C7CBD1]">
                        <Target size={12} className="text-[#00BCC5] shrink-0" />
                        <span className="truncate max-w-[260px] sm:max-w-[340px]">
                          {focusedTask.content}
                        </span>
                        <button
                          onClick={clearFocusedTask}
                          className="text-[#666] hover:text-[#F7F8F8] shrink-0 cursor-pointer"
                          aria-label="Снять фокус с задачи"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="w-full h-1 bg-[#1E1E22] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00BCC5] transition-all duration-500"
                        style={{ width: `${pomoProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleRunning}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium bg-[#00BCC5] hover:bg-[#00A5AD] text-white rounded-lg transition-colors cursor-pointer"
                      >
                        {isRunning ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isRunning ? 'Пауза' : 'Старт'}</span>
                      </button>
                      <button
                        onClick={resetTimer}
                        className="p-2 text-[#8A8F98] hover:text-[#F7F8F8] bg-[#1B1B1F] hover:bg-[#24242A] rounded-lg transition-colors cursor-pointer"
                        title="Сбросить таймер"
                        aria-label="Сбросить таймер"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Productivity Card */}
            <section className="lg:col-span-5 bg-[#121214] border border-[#222226] rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[248px]">
              <div>
                <h2 className="text-[13px] font-medium text-[#8A8F98] flex items-center gap-2">
                  <Zap size={14} className="text-[#00BCC5]" />
                  <span>Продуктивность</span>
                </h2>

                <div className="flex items-baseline gap-3 mt-5">
                  <span className="text-5xl sm:text-[54px] font-semibold text-[#F7F8F8] tracking-tight tabular-nums leading-none">
                    {progress}%
                  </span>
                  <span className="text-sm text-[#7A7F88]">выполнено сегодня</span>
                </div>

                <div className="w-full bg-[#1E1E22] h-2 rounded-full mt-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#C84638] via-[#D07638] to-[#00BCC5]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-[#1E1E22] tabular-nums">
                <div>
                  <p className="text-[11px] text-[#6E727A]">Задачи</p>
                  <p className="text-base font-semibold text-[#F7F8F8] mt-0.5">
                    {completedTasks}
                    <span className="text-[#5C6068] font-normal">/{totalTasks}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6E727A] flex items-center gap-1">
                    <Flame size={11} className="text-amber-400/90" />
                    <span>Привычки</span>
                  </p>
                  <p className="text-base font-semibold text-[#F7F8F8] mt-0.5">
                    {habitsDoneCount}
                    <span className="text-[#5C6068] font-normal">/{activeHabits.length}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6E727A]">Фокус</p>
                  <p className="text-base font-semibold text-[#00BCC5] mt-0.5">
                    {completedSessions}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Row 2: Main Focus List (Clean hairline-divided rows, no nested boxes) */}
          <section className="bg-[#121214] border border-[#222226] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[13px] font-medium text-[#8A8F98] flex items-center gap-2">
                <Target size={14} className="text-[#00BCC5]" />
                <span>Главный фокус</span>
              </h2>
              {focusTasks.length > 0 && (
                <span className="text-xs text-[#6E727A] tabular-nums">
                  {focusTasks.filter((t) => t.checked).length} из {focusTasks.length}
                </span>
              )}
            </div>

            {focusTasks.length === 0 ? (
              <div className="py-4 flex items-center gap-3 text-[#6E727A]">
                <CheckCircle2 size={18} className="text-[#00BCC5] shrink-0" />
                <p className="text-sm">
                  Задач в «Главном фокусе» пока нет — добавьте их на доске «Сегодня».
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1D1D21]">
                {focusTasks.map((task) => {
                  const isFocusedNow = focusedTask?.id === task.id && isRunning;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 -mx-2 px-2 rounded-xl hover:bg-[#18181C] transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className="mt-0.5 text-[#8A8F98] hover:text-[#00BCC5] transition-colors shrink-0 cursor-pointer"
                          aria-label="Отметить задачу"
                        >
                          {task.checked ? (
                            <CheckCircle2 size={18} className="text-[#00BCC5]" />
                          ) : (
                            <Circle size={18} strokeWidth={2} />
                          )}
                        </button>
                        <button
                          onClick={() => onSelectTask(task)}
                          className={`text-left text-[14px] font-medium tracking-tight leading-snug break-words cursor-pointer ${
                            task.checked ? 'text-[#555] line-through' : 'text-[#F0F1F3] hover:text-white'
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
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            isFocusedNow
                              ? 'bg-[#00BCC5] text-white'
                              : 'bg-[#1B1B20] hover:bg-[#25252C] text-[#00BCC5] border border-[#282830]'
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
          </section>

          {/* Row 3: Weekly Activity Chart */}
          <WeeklyActivityChart tasks={tasks} />

          {/* Row 4: Lo-Fi Focus Player + Editorial Quote */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {/* Persistent Lo-Fi Player Card */}
            <section className="bg-[#121214] border border-[#222226] rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[224px]">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-[13px] font-medium text-[#8A8F98] flex items-center gap-2">
                  <Headphones size={14} className="text-[#00BCC5]" />
                  <span>Lo-Fi Фокус</span>
                </h2>
                <div className="flex bg-[#0B0B0D] rounded-lg p-0.5 border border-[#222226]">
                  <button
                    onClick={() => setPlayerMode('radio')}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      playerMode === 'radio'
                        ? 'bg-[#1E1E22] text-[#F7F8F8] font-medium'
                        : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                    }`}
                  >
                    Радио
                  </button>
                  <button
                    onClick={() => setPlayerMode('soundcloud')}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      playerMode === 'soundcloud'
                        ? 'bg-[#1E1E22] text-[#F7F8F8] font-medium'
                        : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                    }`}
                  >
                    SoundCloud
                  </button>
                </div>
              </div>

              {playerMode === 'radio' ? (
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
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
                      <p className="text-[#7A7F88] text-xs truncate mt-0.5">
                        {isPlaying ? 'Играет в фоне на всех вкладках' : station.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Station switcher */}
                  <div className="flex items-center gap-1.5">
                    {RADIO_STATIONS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectStation(s.id)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] border transition-colors cursor-pointer truncate ${
                          station.id === s.id
                            ? 'bg-[#182224] border-[#00BCC5]/40 text-[#00BCC5] font-medium'
                            : 'bg-[#0E0E10] border-[#222226] text-[#8A8F98] hover:text-[#F7F8F8]'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  {/* Volume control */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-[#1E1E22]">
                    <Volume2 size={14} className="text-[#7A7F88] shrink-0" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 accent-[#00BCC5] h-1 bg-[#242429] rounded-lg cursor-pointer"
                      aria-label="Громкость радио"
                    />
                    <span className="text-[11px] font-mono tabular-nums text-[#7A7F88] w-8 text-right">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  {audioError && (
                    <p className="text-[11px] text-amber-400">{audioError}</p>
                  )}
                </div>
              ) : (
                <div className="flex-1 rounded-xl overflow-hidden bg-[#0B0B0D] border border-[#1E1E22] flex">
                  <iframe
                    width="100%"
                    height="100%"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay"
                    src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/chillhopdotcom&color=%2300BCC5&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=true&visual=true"
                    className="flex-1 min-h-[164px]"
                    title="SoundCloud Chillhop Player"
                  />
                </div>
              )}
            </section>

            {/* Quote Card */}
            <section className="bg-[#121214] border border-[#222226] rounded-2xl p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[224px]">
              <Quote
                size={104}
                className="absolute -top-3 -right-3 text-[#1D1D21] opacity-55 rotate-12 pointer-events-none"
                aria-hidden="true"
              />
              <h2 className="text-[13px] font-medium text-[#8A8F98] relative z-10">
                Цитата дня
              </h2>
              <blockquote className="text-[17px] sm:text-[19px] font-medium text-[#E4E6E8] leading-relaxed relative z-10 my-4 text-balance">
                «{quote.text}»
              </blockquote>
              <p className="font-signature text-[28px] leading-none text-[#00BCC5]/90 relative z-10 text-right pr-1">
                — {quote.author}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
