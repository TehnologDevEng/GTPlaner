export type Id = string;

export interface Task {
  id: Id;
  columnId: Id;
  originalColumnId?: Id;
  content: string;
  checked: boolean;
  order?: number;
  updatedAt?: number;
  completedAt?: string; // ISO date string
  archivedAt?: string;  // ISO date string
}

export interface Column {
  id: Id;
  title: string;
}
