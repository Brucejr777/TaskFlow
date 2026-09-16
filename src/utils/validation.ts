import type { Priority, Task } from '../types';

export const isPriority = (value: unknown): value is Priority =>
  value === 'low' || value === 'medium' || value === 'high';

export const isTask = (value: unknown): value is Task => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const task = value as Partial<Task>;

  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.description === 'string' &&
    isPriority(task.priority) &&
    typeof task.dueDate === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'number' &&
    (task.updatedAt === undefined || typeof task.updatedAt === 'number')
  );
};

export const isTaskArray = (value: unknown): value is Task[] =>
  Array.isArray(value) && value.every(isTask);