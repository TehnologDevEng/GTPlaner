import { Quote, Target, CheckCircle2, Zap, Headphones } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { Task } from '@/types';

const quotes = [
  { text: "Секрет того, чтобы вырваться вперед, заключается в том, чтобы начать.", author: "Марк Твен" },
  { text: "Успех — это не окончательно, неудачи — это не фатально, значение имеет лишь мужество продолжать.", author: "Уинстон Черчилль" },
  { text: "Пессимист видит трудность в каждой возможности; оптимист видит возможность в каждой трудности.", author: "Уинстон Черчилль" },
  { text: "Никогда, никогда, никогда не сдавайтесь.", author: "Уинстон Черчилль" },
  { text: "Совершенствоваться — значит меняться, быть совершенным — значит меняться часто.", author: "Уинстон Черчилль" },
  { text: "У вас есть враги? Хорошо. Значит, вы в своей жизни что-то когда-то отстаивали.", author: "Уинстон Черчилль" },
  { text: "Мы хозяева нашей несказанной мысли, но рабы того, что позволили себе сказать.", author: "Уинстон Черчилль" },
  { text: "Лучший способ предсказать будущее — создать его.", author: "Питер Друкер" },
  { text: "То, что не начато сегодня, не будет закончено завтра.", author: "Иоганн Вольфганг фон Гете" }
];

interface Props {
  tasks: Task[];
}

export function Dashboard({ tasks }: Props) {
  const [quote, setQuote] = useState(quotes[0]);

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
        <div className="bg-[#161618] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col justify-center items-start">
          <p className="text-[#8A8F98] text-sm uppercase tracking-wider mb-2">Сегодня</p>
          <h2 className="text-4xl font-bold text-[#F7F8F8] tracking-tight">{today}</h2>
          <p className="text-5xl font-light text-[#00BCC5] mt-4 tracking-tighter">{time}</p>
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
          <p className="text-[#8A8F98] text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Headphones size={14} className="text-[#00BCC5]" />
            Lo-Fi Фокус
          </p>
          <div className="flex-1 rounded-xl overflow-hidden bg-black flex flex-col">
            <iframe 
              width="100%" 
              height="100%" 
              scrolling="no" 
              frameBorder="no" 
              allow="autoplay" 
              src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/chillhopdotcom&color=%2300BCC5&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=true&visual=true"
              className="flex-1"
            ></iframe>
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
