export type Priority = 'low' | 'medium' | 'high';
export type StatusFilter = 'all' | 'active' | 'completed' | 'overdue';
export type SortOption = 'newest' | 'oldest' | 'dueDate' | 'priority';
export type Theme = 'light' | 'dark';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  completed: boolean;
  createdAt: number;
  updatedAt?: number;
  tags: string[];
  subtasks: Subtask[];
  recurrence: Recurrence;
  pinned: boolean;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  tags: string[];
  subtasks: Subtask[];
  recurrence: Recurrence;
  pinned: boolean;
}

export interface TaskStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  progress: number;
}

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}