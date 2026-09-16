import { useCallback, useEffect, useState } from 'react';

export interface FocusSession {
  taskId: string;
  taskTitle: string;
  durationMs: number;
  remainingMs: number;
  running: boolean;
}

export interface FocusSessionApi {
  session: FocusSession | null;
  isComplete: boolean;
  start: (taskId: string, taskTitle: string, minutes: number) => void;
  toggle: () => void;
  stop: () => void;
}

export function useFocusSession(): FocusSessionApi {
  const [session, setSession] = useState<FocusSession | null>(null);

  // Tick the timer only while running. Using the functional updater keeps the
  // interval from needing to re-subscribe on every state change.
  useEffect(() => {
    if (!session || !session.running) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSession((current) => {
        if (!current || !current.running) {
          return current;
        }

        const next = current.remainingMs - 1000;
        if (next <= 0) {
          return { ...current, remainingMs: 0, running: false };
        }
        return { ...current, remainingMs: next };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [session?.running]);

  const start = useCallback(
    (taskId: string, taskTitle: string, minutes: number) => {
      const durationMs = Math.max(1, minutes) * 60 * 1000;
      setSession({
        taskId,
        taskTitle,
        durationMs,
        remainingMs: durationMs,
        running: true,
      });
    },
    [],
  );

  const toggle = useCallback(() => {
    setSession((current) =>
      current ? { ...current, running: !current.running } : current,
    );
  }, []);

  const stop = useCallback(() => setSession(null), []);

  const isComplete = Boolean(session && session.remainingMs === 0);

  return { session, isComplete, start, toggle, stop };
}