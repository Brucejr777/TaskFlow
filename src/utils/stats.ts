import type { Task, TaskStats } from '../types';
import { isOverdue } from './date';

export const getTaskStats = (tasks: Task[], today: Date): TaskStats => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const overdue = tasks.filter((task) => isOverdue(task, today)).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, active, overdue, progress };
};