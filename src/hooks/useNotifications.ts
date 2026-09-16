import { useEffect, useRef } from 'react';
import { REMINDERS_KEY } from '../constants';
import type { Task } from '../types';
import { toDateInputValue } from '../utils/date';

const loadReminders = (): Record<string, string> => {
  try {
    const raw = window.localStorage.getItem(REMINDERS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* Ignore */
  }
  return {};
};

const persistReminders = (reminders: Record<string, string>) => {
  try {
    window.localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch {
    /* Ignore */
  }
};

/**
 * Sends a browser notification the first time we see a task whose due date is
 * today and hasn't been announced yet today. Notification ids are stored so a
 * task is only announced once per day even across reloads.
 */
export function useNotifications(tasks: Task[], enabled: boolean, today: Date) {
  const todayKey = toDateInputValue(today);
  const remindersRef = useRef<Record<string, string>>(loadReminders());

  // Lazily request permission when the user enables reminders.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (typeof Notification === 'undefined') {
      return;
    }
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    const check = () => {
      const reminders = remindersRef.current;
      let dirty = false;

      for (const task of tasks) {
        if (task.completed || task.archived || !task.dueDate) {
          continue;
        }
        if (task.dueDate !== todayKey) {
          continue;
        }
        if (reminders[task.id] === todayKey) {
          continue;
        }

        try {
          new Notification('Task due today', {
            body: task.title,
            tag: task.id,
          });
        } catch {
          /* Some environments disallow constructing notifications. */
        }

        reminders[task.id] = todayKey;
        dirty = true;
      }

      if (dirty) {
        persistReminders(reminders);
      }
    };

    check();
    const intervalId = window.setInterval(check, 60_000);
    return () => window.clearInterval(intervalId);
  }, [enabled, tasks, todayKey]);
}