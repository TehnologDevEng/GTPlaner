import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { format } from 'date-fns';

const STORAGE_KEY = 'planner2026_linear_tasks';
const DATE_KEY = 'planner2026_last_date';

const defaultTasks: Task[] = [
  { id: '1', columnId: 'focus', content: 'Определить ключевые цели на месяц', checked: false },
  { id: '2', columnId: 'tasks', content: 'Перенести логику сохранения в localStorage', checked: false },
  { id: '3', columnId: 'tasks', content: 'Реализовать Drag and Drop с помощью dnd-kit', checked: true },
  { id: '4', columnId: 'habits', content: 'Прочитать 20 страниц', checked: false },
  { id: '5', columnId: 'personal', content: 'Записаться к врачу', checked: false },
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let parsedTasks = stored ? JSON.parse(stored) : defaultTasks;
    
    const lastDate = localStorage.getItem(DATE_KEY);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Auto-rollover and archive logic on a new day
    if (lastDate && lastDate !== today) {
      parsedTasks = parsedTasks.map((t: Task) => 
        (t.checked && t.columnId !== 'archive') ? { ...t, columnId: 'archive' } : t
      );
    }
    
    localStorage.setItem(DATE_KEY, today);
    return parsedTasks;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  return [tasks, setTasks] as const;
}
