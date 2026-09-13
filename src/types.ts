export type Id = string;

export interface Task {
  id: Id;
  columnId: Id;
  content: string;
  checked: boolean;
}

export interface Column {
  id: Id;
  title: string;
}
