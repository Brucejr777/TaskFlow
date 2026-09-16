import { priorityRanks } from '../constants';
import type { Priority, SortOption, StatusFilter, Task } from '../types';
import { isOverdue } from './date';

export interface FilterAndSortOptions {
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