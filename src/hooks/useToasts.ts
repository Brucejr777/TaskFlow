import { useCallback, useEffect, useRef, useState } from 'react';
import { TOAST_DURATION_MS } from '../constants';
import type { Toast, ToastKind } from '../types';
import { createId } from '../utils/id';

interface ToastOptions {
  kind?: ToastKind;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastApi {
  toasts: Toast[];
  push: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export function useToasts(): ToastApi {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = createId();
      const duration = options.duration ?? TOAST_DURATION_MS;

      const toast: Toast = {
        id,
        message,
        kind: options.kind ?? 'info',
        actionLabel: options.actionLabel,
        onAction: options.onAction,
        duration,
      };

      setToasts((current) => [...current, toast]);

      if (duration > 0) {
        const timeoutId = window.setTimeout(() => dismiss(id), duration);
        timeoutsRef.current.set(id, timeoutId);
      }

      return id;
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    },
    [],
  );

  return { toasts, push, dismiss };
}