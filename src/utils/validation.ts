import type { Priority, Recurrence, Subtask, Task } from '../types';

export const isPriority = (value: unknown): value is Priority =>
  value === 'low' || value === 'medium' || value === 'high';

export const isRecurrence = (value: unknown): value is Recurrence =>
  value === 'none' ||
  value === 'daily' ||
  value === 'weekly' ||
  value === 'monthly';

export const parseSubtask = (value: unknown): Subtask | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const subtask = value as Partial<Subtask>;

  if (typeof subtask.id !== 'string' || typeof subtask.title !== 'string') {
    return null;
  }

  return {
    id: subtask.id,
    title: subtask.title,
    done: typeof subtask.done === 'boolean' ? subtask.done : false,
  };
};

export const parseTask = (value: unknown): Task | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const task = value as Partial<Task> & Record<string, unknown>;

  if (
    typeof task.id !== 'string' ||
    typeof task.title !== 'string' ||
    typeof task.completed !== 'boolean' ||
    typeof task.createdAt !== 'number'
  ) {
    return null;
  }

  const tags = Array.isArray(task.tags)
    ? task.tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];

  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks
        .map(parseSubtask)
        .filter((subtask): subtask is Subtask => subtask !== null)
    : [];

  return {
    id: task.id,
    title: task.title,
    description: typeof task.description === 'string' ? task.description : '',
    priority: isPriority(task.priority) ? task.priority : 'medium',
    dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
    completed: task.completed,
    archived: typeof task.archived === 'boolean' ? task.archived : false,
    createdAt: task.createdAt,
    updatedAt: typeof task.updatedAt === 'number' ? task.updatedAt : undefined,
    tags,
    subtasks,
    recurrence: isRecurrence(task.recurrence) ? task.recurrence : 'none',
    pinned: typeof task.pinned === 'boolean' ? task.pinned : false,
    focusSessions: typeof task.focusSessions === 'number' ? task.focusSessions : 0,
    focusMinutes: typeof task.focusMinutes === 'number' ? task.focusMinutes : 0,
  };
};

export const parseTasks = (value: unknown): Task[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed: Task[] = [];
  for (const item of value) {
    const task = parseTask(item);
    if (task) {
      parsed.push(task);
    }
  }

  return parsed;
};