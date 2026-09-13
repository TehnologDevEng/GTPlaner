import { Quote, Target, CheckCircle2, Zap, Headphones } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { FlipClock } from './FlipClock';

const quotes = [
  { text: "Секрет того, чтобы вырваться вперед, заключается в том, чтобы начать.", author: "Марк Твен" },
  { text: "Успех — это не окончательно, неудачи — это не фатально, значение имеет лишь мужество продолжать.", author: "Уинстон Черчилль" },
  { text: "Пессимист видит трудность в каждой возможности; оптимист видит возможность в каждой трудности.", author: "Уинстон Черчилль" },
  { text: "Никогда, никогда, никогда не сдавайтесь.", author: "Уинстон Черчилль" },
  { text: "Совершенствоваться — значит меняться, быть совершенным — значит меняться часто.", author: "Уинстон Черчилль" },
  { text: "У вас есть враги? Хорошо. Значит, вы в своей жизни что-то когда-то отстаивали.", author: "Уинстон Черчилль" },
  { text: "Мы хозяева нашей несказанной мысли, но рабы того, что позволили себе сказать.", author: "Уинстон Черчилль" },
  { text: "Лучший способ предсказать будущее — создать его.", author: "Питер Друкер" },
  { text: "То, что не начато сегодня, не будет закончено завтра.", author: "Иоганн Вольфганг фон Гете" },
  { text: "Ваше время ограничено, не тратьте его, проживая чужую жизнь.", author: "Стив Джобс" },
  { text: "Единственный способ делать великие дела — любить то, что вы делаете.", author: "Стив Джобс" },
  { text: "То, что мы делаем сегодня, определяет то, кем мы станем завтра.", author: "Марк Аврелий" },
  { text: "Препятствие на пути становится самим путем.", author: "Марк Аврелий" },
  { text: "Сложнее всего начать действовать, все остальное зависит только от упорства.", author: "Амелия Эрхарт" },
  { text: "Не ждите. Время никогда не будет «идеальным».", author: "Наполеон Хилл" },
  { text: "Логика приведет вас из пункта А в пункт Б. Воображение приведет вас куда угодно.", author: "Альберт Эйнштейн" },
  { text: "Стремитесь не к тому, чтобы добиться успеха, а к тому, чтобы ваша жизнь имела смысл.", author: "Альберт Эйнштейн" },
  { text: "Начинайте там, где вы есть. Используйте то, что у вас есть. Делайте то, что можете.", author: "Артур Эш" },
  { text: "Через год вы будете жалеть, что не начали сегодня.", author: "Карен Лэмб" },
  { text: "Либо вы управляете днем, либо день управляет вами.", author: "Джим Рон" },
  { text: "Делай, что можешь, с тем, что имеешь, там, где ты есть.", author: "Теодор Рузвельт" },
  { text: "Успех — это сумма небольших усилий, повторяющихся изо дня в день.", author: "Роберт Коллиер" },
  { text: "Дисциплина — это мост между целями и достижениями.", author: "Джим Рон" },
  { text: "Те, кто достаточно безумен, чтобы думать, что могут изменить мир, как раз и меняют его.", author: "Стив Джобс" },
  { text: "То, что кажется нам горькими испытаниями, часто является скрытым благословением.", author: "Оскар Уайльд" },
  { text: "Чем больше я работаю, тем больше мне везет.", author: "Томас Джефферсон" },
  { text: "Счастье не в том, чтобы делать всегда то, что хочешь, а в том, чтобы всегда хотеть того, что делаешь.", author: "Лев Толстой" },
  { text: "Если вы идете сквозь ад — идите не останавливаясь.", author: "Уинстон Черчилль" },
  { text: "Успех — это способность шагать от одной неудачи к другой, не теряя энтузиазма.", author: "Уинстон Черчилль" },
  { text: "Вы никогда не дойдете до места назначения, если будете бросать камень в каждую лающую собаку.", author: "Уинстон Черчилль" },
  { text: "Преодоленные трудности — это выигранные возможности.", author: "Уинстон Черчилль" },
  { text: "Бесполезно говорить: «Мы делаем всё, что можем». Надо сделать то, что необходимо.", author: "Уинстон Черчилль" },
  { text: "Мужество — это то, что требуется, чтобы встать и сказать; мужество — это также то, что требуется, чтобы сесть и выслушать.", author: "Уинстон Черчилль" },
  { text: "Я всегда готов учиться, но мне не всегда нравится, когда меня учат.", author: "Уинстон Черчилль" },
  { text: "Ответственность — это та цена, которую мы платим за величие.", author: "Уинстон Черчилль" },
  { text: "Если мы откроем спор между прошлым и настоящим, то обнаружим, что потеряли будущее.", author: "Уинстон Черчилль" },
  { text: "Планы мало что значат, но планирование — это всё.", author: "Уинстон Черчилль" }
];

interface Props {
  tasks: Task[];
}

export function Dashboard({ tasks }: Props) {
  const [quote, setQuote] = useState(quotes[0]);
  const [playerMode, setPlayerMode] = useState<'radio' | 'soundcloud'>('radio');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  const today = format(new Date(), 'd MMMM yyyy', { locale: ru });
  const time = format(new Date(), 'HH:mm');
  const hour = new Date().getHours();
  
  let greeting = 'Доброй ночи';
  if (hour >= 6 && hour < 12) greeting = 'Доброе утро';
  else if (hour >= 12 && hour < 18) greeting = 'Добрый день';
  else if (hour >= 18 && hour < 23) greeting = 'Добрый вечер';

  const boardTasks = tasks.filter(t => t.columnId !== 'archive' && t.columnId !== 'inbox');
  const totalTasks = boardTasks.length;
  const completedTasks = boardTasks.filter(t => t.checked).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const focusTasks = tasks.filter(t => t.columnId === 'focus' && !t.checked);

  return (
    <div className="flex flex-col h-full bg-[#000000] p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8 text-[#F7F8F8]">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Date / Time Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5 flex flex-col justify-center items-start w-full overflow-hidden">
          <p className="text-[#8A8F98] text-xs sm:text-sm uppercase tracking-wider mb-1.5">Сегодня</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F8F8] tracking-tight leading-tight break-words hyphens-auto w-full">{today}</h2>
          <div className="w-full mt-4 sm:mt-5">
            <FlipClock />
          </div>
        </div>

        {/* Task Progress Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-[#8A8F98] text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap size={14} className="text-[#00BCC5]" />
              Продуктивность
            </p>
            <div className="flex items-end gap-3 mt-4">
              <h2 className="text-5xl font-bold text-[#F7F8F8] tracking-tight">{progress}%</h2>
              <p className="text-[#8A8F98] pb-1">выполнено</p>
            </div>
            <p className="text-[14px] text-[#8A8F98] mt-2">
              {completedTasks} из {totalTasks} задач на доске
            </p>
          </div>
          
          <div className="w-full bg-[#222] h-2 rounded-full mt-6 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-[#C84638] via-[#C86A36] to-[#00BCC5]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Focus of the day */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 md:col-span-2">
          <p className="text-[#8A8F98] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target size={14} className="text-[#00BCC5]" />
            Главный фокус
          </p>
          
          {focusTasks.length === 0 ? (
            <div className="py-4 flex items-center gap-3 text-[#555]">
              <CheckCircle2 size={24} />
              <p className="text-[15px]">Все главные задачи выполнены. Отличная работа!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {focusTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 bg-[#1A1A1C] p-4 rounded-xl border border-[#2A2A2A]">
                  <div className="mt-[2px] text-[#00BCC5]">
                    <Target size={16} />
                  </div>
                  <p className="text-[15px] font-medium text-[#F7F8F8] tracking-tight leading-snug">
                    {task.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lo-Fi Player Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col justify-between md:col-span-1 min-h-[220px]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#8A8F98] text-sm uppercase tracking-wider flex items-center gap-2">
              <Headphones size={14} className="text-[#00BCC5]" />
              Lo-Fi Фокус
            </p>
            <div className="flex bg-[#0E0E0F] rounded-lg p-1 border border-[#2A2A2A]">
              <button 
                onClick={() => setPlayerMode('radio')}
                className={`text-[11px] px-2 py-1 rounded-md transition-colors ${playerMode === 'radio' ? 'bg-[#222] text-[#F7F8F8]' : 'text-[#8A8F98] hover:text-[#F7F8F8]'}`}
              >
                Радио
              </button>
              <button 
                onClick={() => setPlayerMode('soundcloud')}
                className={`text-[11px] px-2 py-1 rounded-md transition-colors ${playerMode === 'soundcloud' ? 'bg-[#222] text-[#F7F8F8]' : 'text-[#8A8F98] hover:text-[#F7F8F8]'}`}
              >
                SoundCloud
              </button>
            </div>
          </div>
          
          <div className="flex-1 rounded-xl overflow-hidden bg-black flex flex-col relative group">
            {playerMode === 'radio' ? (
              <>
                {/* Custom Audio Player for raw stream to bypass restrictions */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1c] to-black z-10 p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#00BCC5]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                     <Headphones size={24} className="text-[#00BCC5]" />
                  </div>
                  <h3 className="text-[#F7F8F8] font-medium text-sm mb-1">Chill Lofi Radio</h3>
                  <p className="text-[#8A8F98] text-xs mb-4">24/7 Бесперебойный эфир</p>
                  
                  <audio 
                    controls 
                    className="w-full max-w-[200px] h-8 outline-none grayscale opacity-80 hover:opacity-100 transition-opacity" 
                    preload="none"
                  >
                    {/* Российские серверы вещания (работают без VPN) */}
                    <source src="https://radiorecord.hostingradio.ru/lofi96.aacp" type="audio/aac" />
                    <source src="https://radiorecord.hostingradio.ru/chillout96.aacp" type="audio/aac" />
                    Ваш браузер не поддерживает аудио.
                  </audio>
                </div>
                {/* Visual background effect */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
              </>
            ) : (
              <iframe 
                width="100%" 
                height="100%" 
                scrolling="no" 
                frameBorder="no" 
                allow="autoplay" 
                src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/chillhopdotcom&color=%2300BCC5&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=true&visual=true"
                className="flex-1"
              ></iframe>
            )}
          </div>
        </div>

        {/* Quote Card */}
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 md:col-span-1 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
          <Quote size={120} className="absolute -top-4 -right-4 text-[#222] opacity-50 rotate-12" />
          <p className="text-[#8A8F98] text-sm uppercase tracking-wider mb-4 relative z-10 flex items-center gap-2">
            Цитата дня
          </p>
          <blockquote className="text-xl md:text-2xl font-medium text-[#DEDEDE] leading-relaxed relative z-10 max-w-2xl">
            "{quote.text}"
          </blockquote>
          <p className="text-[#8A8F98] mt-4 relative z-10">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}
