import type { Task } from '../types';
import { toDateInputValue } from './date';

export const EXPORT_VERSION = 1;

export interface TaskExportPayload {
  app: 'taskflow';
  version: number;
  exportedAt: string;
  tasks: Task[];
}

export const buildExportPayload = (tasks: Task[]): TaskExportPayload => ({
  app: 'taskflow',
  version: EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  tasks,
});

export const downloadTasks = (tasks: Task[]): void => {
  const payload = buildExportPayload(tasks);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `taskflow-${toDateInputValue(new Date())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const extractTasksFromImport = (data: unknown): unknown => {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.tasks)) {
      return record.tasks;
    }
  }

  return null;
};