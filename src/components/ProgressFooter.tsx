import type { TaskStats } from '../types';

interface ProgressFooterProps {
  stats: TaskStats;
  onClearCompleted: () => void;
}

export function ProgressFooter({ stats, onClearCompleted }: ProgressFooterProps) {
  if (stats.completed === 0) {
    return null;
  }

  return (
    <div className="list-footer">
      <span>
        {stats.completed} of {stats.total} completed
      </span>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${stats.progress}%` }} />
      </div>
      <button type="button" onClick={onClearCompleted}>
        Clear completed
      </button>
    </div>
  );
}