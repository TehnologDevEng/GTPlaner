import { BoardColumnId, Column, CustomColumnTitles } from '@/types';

export interface ColumnMeta {
  id: BoardColumnId | 'inbox' | 'archive';
  defaultTitle: string;
  dotColor: string;
  textColor: string;
  accentHex: string;
}

export const BOARD_COLUMNS: Column[] = [
  { id: 'focus', title: 'Главный фокус' },
  { id: 'tasks', title: 'Задачи дня' },
  { id: 'calls', title: 'Звонки и письма' },
  { id: 'habits', title: 'Трекер привычек' },
  { id: 'personal', title: 'Не забыть' },
];

export const COLUMN_META: Record<string, ColumnMeta> = {
  focus: {
    id: 'focus',
    defaultTitle: 'Главный фокус',
    dotColor: 'bg-[#C84638]',
    textColor: 'text-[#E06C60]',
    accentHex: '#C84638',
  },
  tasks: {
    id: 'tasks',
    defaultTitle: 'Задачи дня',
    dotColor: 'bg-[#C86A36]',
    textColor: 'text-[#E5925E]',
    accentHex: '#C86A36',
  },
  calls: {
    id: 'calls',
    defaultTitle: 'Звонки и письма',
    dotColor: 'bg-[#3B82F6]',
    textColor: 'text-[#60A5FA]',
    accentHex: '#3B82F6',
  },
  habits: {
    id: 'habits',
    defaultTitle: 'Трекер привычек',
    dotColor: 'bg-[#A855F7]',
    textColor: 'text-[#C084FC]',
    accentHex: '#A855F7',
  },
  personal: {
    id: 'personal',
    defaultTitle: 'Не забыть',
    dotColor: 'bg-[#10B981]',
    textColor: 'text-[#34D399]',
    accentHex: '#10B981',
  },
  inbox: {
    id: 'inbox',
    defaultTitle: 'Инбокс',
    dotColor: 'bg-[#00BCC5]',
    textColor: 'text-[#00BCC5]',
    accentHex: '#00BCC5',
  },
  archive: {
    id: 'archive',
    defaultTitle: 'Архив',
    dotColor: 'bg-[#6B7280]',
    textColor: 'text-[#9CA3AF]',
    accentHex: '#6B7280',
  },
};

export function getColumnTitle(columnId: string, customTitles?: CustomColumnTitles): string {
  if (customTitles && columnId in customTitles) {
    const custom = customTitles[columnId as BoardColumnId];
    if (custom && custom.trim()) return custom.trim();
  }
  return COLUMN_META[columnId]?.defaultTitle || 'Задачи дня';
}

export function getBoardColumns(customTitles?: CustomColumnTitles): Column[] {
  return BOARD_COLUMNS.map((col) => ({
    id: col.id,
    title: getColumnTitle(col.id, customTitles),
  }));
}
