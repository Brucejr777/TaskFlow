import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { Toast, ToastKind } from '../types';

interface ToastViewportProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const kindIcon: Record<ToastKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = kindIcon[toast.kind] ?? Info;
        return (
          <div
            className={`toast toast-${toast.kind}`}
            key={toast.id}
            role="status"
          >
            <span className="toast-icon" aria-hidden="true">
              <Icon size={15} />
            </span>
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
        );
      })}
    </div>
  );
}