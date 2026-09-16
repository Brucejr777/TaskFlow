import { useCallback, useEffect, useState } from 'react';

export type FocusPhase = 'work' | 'break';

export interface FocusSession {
  taskId: string;
  taskTitle: string;
  phase: FocusPhase;
  durationMs: number;
  remainingMs: number;
  running: boolean;
  /** The original work-phase duration, preserved so we can log accurate minutes. */
  workDurationMs: number;
}

export interface FocusSessionApi {
  session: FocusSession | null;
  isComplete: boolean;
  start: (taskId: string, taskTitle: string, minutes: number) => void;
  startBreak: (minutes: number) => void;
  toggle: () => void;
  stop: () => void;
  extend: (minutes: number) => void;
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
        phase: 'work',
        durationMs,
        remainingMs: durationMs,
        running: true,
        workDurationMs: durationMs,
      });
    },
    [],
  );

  const startBreak = useCallback((minutes: number) => {
    setSession((current) => {
      if (!current) {
        return current;
      }
      const durationMs = Math.max(1, minutes) * 60 * 1000;
      return {
        taskId: current.taskId,
        taskTitle: current.taskTitle,
        phase: 'break',
        durationMs,
        remainingMs: durationMs,
        running: true,
        workDurationMs: current.workDurationMs,
      };
    });
  }, []);

  const toggle = useCallback(() => {
    setSession((current) =>
      current ? { ...current, running: !current.running } : current,
    );
  }, []);

  const stop = useCallback(() => setSession(null), []);

  const extend = useCallback((minutes: number) => {
    setSession((current) => {
      if (!current) {
        return current;
      }
      const addMs = Math.max(1, minutes) * 60 * 1000;
      return {
        ...current,
        durationMs: current.durationMs + addMs,
        remainingMs: current.remainingMs + addMs,
        running: true,
      };
    });
  }, []);

  const isComplete = Boolean(session && session.remainingMs === 0);

  return { session, isComplete, start, startBreak, toggle, stop, extend };
}