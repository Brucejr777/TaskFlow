import type { Priority, Recurrence, SortOption, StatusFilter } from './types';

export const STORAGE_KEY = 'taskflow.tasks.v1';
export const THEME_KEY = 'taskflow.theme.v1';

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 500;
export const TASK_TAG_MAX_COUNT = 6;
export const TASK_TAG_MAX_LENGTH = 20;
export const TASK_SUBTASK_MAX_COUNT = 20;
export const TASK_SUBTASK_MAX_LENGTH = 100;
export const TOAST_DURATION_MS = 5000;

export const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const priorityRanks: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const priorityOptions: Priority[] = ['low', 'medium', 'high'];

export const recurrenceLabels: Record<Recurrence, string> = {
  none: 'Does not repeat',
  daily: 'Repeats daily',
  weekly: 'Repeats weekly',
  monthly: 'Repeats monthly',
};

export const recurrenceShortLabels: Record<Recurrence, string> = {
  none: '',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export const recurrenceOptions: Recurrence[] = ['none', 'daily', 'weekly', 'monthly'];

export const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All tasks' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
];