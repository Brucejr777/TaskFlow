import type { Priority, SortOption, StatusFilter, Task, TaskStats } from '../types';
import { priorityRanks } from '../constants';
import { isOverdue } from './date';

export const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const isPriority = (value: unknown): value is Priority =>
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

interface FilterAndSortOptions {
  search: string;
  statusFilter: StatusFilter;
  priorityFilter: Priority | 'all';
  sortOption: SortOption;
  today: Date;
}

export const filterAndSortTasks = (
  tasks: Task[],
  options: FilterAndSortOptions,
): Task[] => {
  const query = options.search.trim().toLowerCase();

  const visibleTasks = tasks.filter((task) => {
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query);

    const matchesStatus =
      options.statusFilter === 'all' ||
      (options.statusFilter === 'active' && !task.completed) ||
      (options.statusFilter === 'completed' && task.completed) ||
      (options.statusFilter === 'overdue' && isOverdue(task, options.today));

    const matchesPriority =
      options.priorityFilter === 'all' || task.priority === options.priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return [...visibleTasks].sort((first, second) => {
    if (options.sortOption === 'newest') {
      return second.createdAt - first.createdAt;
    }

    if (options.sortOption === 'oldest') {
      return first.createdAt - second.createdAt;
    }

    if (options.sortOption === 'dueDate') {
      if (!first.dueDate && !second.dueDate) {
        return second.createdAt - first.createdAt;
      }

      if (!first.dueDate) {
        return 1;
      }

      if (!second.dueDate) {
        return -1;
      }

      return first.dueDate.localeCompare(second.dueDate);
    }

    const priorityDifference =
      priorityRanks[second.priority] - priorityRanks[first.priority];

    return priorityDifference || second.createdAt - first.createdAt;
  });
};

export const getTaskStats = (tasks: Task[], today: Date): TaskStats => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const overdue = tasks.filter((task) => isOverdue(task, today)).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, active, overdue, progress };
};