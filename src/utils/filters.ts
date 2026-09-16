import { priorityRanks } from '../constants';
import type { Priority, SortOption, StatusFilter, Task } from '../types';
import { isOverdue } from './date';

export interface FilterAndSortOptions {
  search: string;
  statusFilter: StatusFilter;
  priorityFilter: Priority | 'all';
  tagFilter: string;
  sortOption: SortOption;
  today: Date;
}

export const filterAndSortTasks = (
  tasks: Task[],
  options: FilterAndSortOptions,
): Task[] => {
  const query = options.search.trim().toLowerCase();
  const archivedView = options.statusFilter === 'archived';

  const visibleTasks = tasks.filter((task) => {
    const isArchived = task.archived === true;

    // Archive status is a hard mode: either we're browsing the archive or we're
    // browsing live tasks — never a mix.
    if (isArchived !== archivedView) {
      return false;
    }

    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.tags.some((tag) => tag.toLowerCase().includes(query));

    const matchesStatus = archivedView
      ? true
      : options.statusFilter === 'all' ||
        (options.statusFilter === 'active' && !task.completed) ||
        (options.statusFilter === 'completed' && task.completed) ||
        (options.statusFilter === 'overdue' && isOverdue(task, options.today));

    const matchesPriority =
      options.priorityFilter === 'all' || task.priority === options.priorityFilter;

    const matchesTag = !options.tagFilter || task.tags.includes(options.tagFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesTag;
  });

  return [...visibleTasks].sort((first, second) => {
    const pinnedDifference = (second.pinned ? 1 : 0) - (first.pinned ? 1 : 0);
    if (pinnedDifference !== 0) {
      return pinnedDifference;
    }

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