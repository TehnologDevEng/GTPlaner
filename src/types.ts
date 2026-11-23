export type Id = string;

export type BoardColumnId = 'focus' | 'tasks' | 'calls' | 'habits' | 'personal';
export type ColumnId = BoardColumnId | 'inbox' | 'archive';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  content: string;
  checked: boolean;
}

export interface Task {
  id: Id;
  ownerId?: string;
  columnId: ColumnId | string;
  originalColumnId?: ColumnId | string;
  content: string;
  checked: boolean;
  order?: number;
  notes?: string;
  priority?: TaskPriority;
  subtasks?: Subtask[];
  streak?: number;
  lastCompletedDate?: string; // yyyy-MM-dd
  habitHistory?: string[];    // yyyy-MM-dd[] (bounded max 60)
  updatedAt?: number;
  completedAt?: string;       // ISO date string
  archivedAt?: string;        // ISO date string
}

export interface Column {
  id: BoardColumnId;
  title: string;
}

export type CustomColumnTitles = Partial<Record<BoardColumnId, string>>;

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

export interface SyncDiagnosticsResult {
  ok: boolean;
  latencyMs: number;
  databaseId: string;
  projectId: string;
  checkedAt: string;
  error?: string;
}
