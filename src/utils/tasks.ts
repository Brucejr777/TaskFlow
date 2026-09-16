import type { Task } from '../types';
import { createId } from './id';

/**
 * Produce a fresh copy of a task: new id, reset completion, subtasks and
 * focus counters, back to the "todo" column, and a title suffix so the two
 * are easy to tell apart.
 */
export const duplicateTask = (task: Task): Task => ({
  ...task,
  id: createId(),
  title: `${task.title} (copy)`,
  completed: false,
  archived: false,
  status: 'todo',
  completedAt: undefined,
  createdAt: Date.now(),
  updatedAt: undefined,
  tags: [...task.tags],
  subtasks: task.subtasks.map((subtask) => ({
    ...subtask,
    id: createId(),
    done: false,
  })),
  focusSessions: 0,
  focusMinutes: 0,
  pinned: false,
});