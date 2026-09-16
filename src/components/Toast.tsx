import { X } from 'lucide-react';
import type { Toast } from '../types';

interface ToastViewportProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.kind}`} key={toast.id} role="status">
          <span className="toast-message">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}