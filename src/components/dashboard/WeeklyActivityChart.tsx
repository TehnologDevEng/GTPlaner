import React, { useMemo } from 'react';
import { Task } from '@/types';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';

interface Props {
  tasks: Task[];
}

export const WeeklyActivityChart: React.FC<Props> = ({ tasks }) => {
  const { last7Days, last28Days, maxCount7, total7, bestDayCount } = useMemo(() => {
    const countsByDate: Record<string, number> = {};

    tasks.forEach((t) => {
      if (t.columnId === 'habits' && Array.isArray(t.habitHistory) && t.habitHistory.length > 0) {
        t.habitHistory.forEach((dayKey) => {
          countsByDate[dayKey] = (countsByDate[dayKey] || 0) + 1;
        });
        return;
      }

      const rawDate = t.completedAt || (t.columnId === 'archive' ? t.archivedAt : undefined);
      if (rawDate && (t.checked || t.columnId === 'archive')) {
        try {
          const dayKey = format(new Date(rawDate), 'yyyy-MM-dd');
          countsByDate[dayKey] = (countsByDate[dayKey] || 0) + 1;
        } catch {
          // Skip malformed date
        }
      }
    });

    const today = new Date();

    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      const shortDay = format(d, 'EEEEEE', { locale: ru });
      const label = shortDay.charAt(0).toUpperCase() + shortDay.slice(1);
      return {
        key,
        label,
        fullDate: format(d, 'd MMM', { locale: ru }),
        count: countsByDate[key] || 0,
        isToday: i === 6,
      };
    });

    const days28 = Array.from({ length: 28 }, (_, i) => {
      const d = subDays(today, 27 - i);
      const key = format(d, 'yyyy-MM-dd');
      return {
        key,
        fullDate: format(d, 'd MMMM', { locale: ru }),
        count: countsByDate[key] || 0,
      };
    });

    const max7 = Math.max(4, ...days7.map((d) => d.count));
    const sum7 = days7.reduce((acc, d) => acc + d.count, 0);
    const best = Math.max(0, ...days7.map((d) => d.count));

    return {
      last7Days: days7,
      last28Days: days28,
      maxCount7: max7,
      total7: sum7,
      bestDayCount: best,
    };
  }, [tasks]);

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-[#1C1C20]';
    if (count === 1) return 'bg-[#00BCC5]/30';
    if (count <= 3) return 'bg-[#00BCC5]/55';
    if (count <= 5) return 'bg-[#00BCC5]/80';
    return 'bg-[#00BCC5]';
  };

  return (
    <section className="bg-[#121214] border border-[#222226] rounded-2xl p-5 sm:p-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[13px] font-medium text-[#8A8F98] flex items-center gap-2">
            <BarChart3 size={14} className="text-[#00BCC5]" />
            <span>Активность за 7 дней</span>
          </h2>
          <div className="flex items-baseline gap-2.5 mt-2 text-xs text-[#8A8F98] tabular-nums">
            <span>
              За неделю:{' '}
              <strong className="text-[#F7F8F8] font-semibold">{total7}</strong>
            </span>
            <span aria-hidden="true" className="text-[#444]">·</span>
            <span>
              Лучший день:{' '}
              <strong className="text-[#F7F8F8] font-semibold">{bestDayCount}</strong>
            </span>
          </div>
        </div>

        {/* Compact 28-day mini heatmap */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <span className="text-[11px] text-[#6E727A]">Последние 28 дней</span>
          <div className="grid grid-cols-14 gap-1">
            {last28Days.map((day) => (
              <div
                key={day.key}
                title={`${day.fullDate}: ${day.count} вып.`}
                className={`w-2.5 h-2.5 rounded-[3px] transition-colors ${getHeatColor(day.count)}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 7-day bar chart */}
      <div className="grid grid-cols-7 gap-2 sm:gap-5 items-end h-28 pt-2">
        {last7Days.map((day) => {
          const heightPct = day.count === 0 ? 6 : Math.max(14, Math.round((day.count / maxCount7) * 100));
          return (
            <div
              key={day.key}
              className="flex flex-col items-center gap-2 h-full justify-end group"
              title={`${day.fullDate}: ${day.count}`}
            >
              <span className="text-[11px] font-mono tabular-nums text-[#8A8F98] group-hover:text-[#F7F8F8] transition-colors h-4">
                {day.count > 0 ? day.count : ''}
              </span>
              <div className="w-full max-w-[40px] flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    day.isToday
                      ? 'bg-[#00BCC5]'
                      : day.count > 0
                      ? 'bg-[#00BCC5]/45 group-hover:bg-[#00BCC5]/75'
                      : 'bg-[#1D1D22]'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span
                className={`text-[11px] font-medium ${
                  day.isToday ? 'text-[#00BCC5]' : 'text-[#7A7F88]'
                }`}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
