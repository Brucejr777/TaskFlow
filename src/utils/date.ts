import type { Recurrence, Task } from '../types';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDueDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isOverdue = (task: Task, today: Date): boolean => {
  if (!task.dueDate || task.completed) {
    return false;
  }

  const dueDate = parseDueDate(task.dueDate);
  if (!dueDate) {
    return false;
  }

  return toDateInputValue(dueDate) < toDateInputValue(today);
};

export const formatDate = (value: string): string => {
  const date = parseDueDate(value);
  return date ? dateFormatter.format(date) : 'No due date';
};

export const formatShortDate = (value: number | string): string => {
  const date = typeof value === 'number' ? new Date(value) : parseDueDate(value);
  return date ? shortDateFormatter.format(date) : '';
};

export const getRelativeDateLabel = (value: string, today: Date): string => {
  if (!value) {
    return 'No due date';
  }

  const dueDate = parseDueDate(value);
  if (!dueDate) {
    return 'No due date';
  }

  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + 1);
  const dueDay = dueDate.toDateString();

  if (dueDay === today.toDateString()) {
    return 'Due today';
  }

  if (dueDay === nextDate.toDateString()) {
    return 'Due tomorrow';
  }

  return formatDate(value);
};

export const getNextDueDate = (
  currentDueDate: string,
  recurrence: Recurrence,
): string => {
  if (recurrence === 'none') {
    return currentDueDate;
  }

  const base = parseDueDate(currentDueDate) ?? getToday();
  const next = new Date(base);

  if (recurrence === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  }

  return toDateInputValue(next);
};