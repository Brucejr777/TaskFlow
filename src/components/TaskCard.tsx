import { CalendarDays, Check, Flag, Pencil, Trash2 } from 'lucide-react';
import { priorityLabels } from '../constants';
import type { Task } from '../types';
import { formatShortDate, getRelativeDateLabel, isOverdue } from '../utils/date';

interface TaskCardProps {
  task: Task;
  today: Date;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, today, onToggle, onEdit, onDelete }: TaskCardProps) {
  const overdueTask = isOverdue(task, today);

  return (
    <article
      className={`task-card ${task.completed ? 'is-completed' : ''} ${
        overdueTask ? 'is-overdue' : ''
      }`}
    >
      <button
        className={`task-check ${task.priority}`}
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={
          task.completed
            ? `Mark ${task.title} as active`
            : `Mark ${task.title} as completed`
        }
        aria-pressed={task.completed}
      >
        {task.completed && <Check size={16} strokeWidth={3} />}
      </button>
      <div className="task-card-content">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className={`priority-badge priority-${task.priority}`}>
            <Flag size={12} />
            {priorityLabels[task.priority]}
          </span>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`due-meta ${overdueTask ? 'due-overdue' : ''}`}>
            <CalendarDays size={14} />
            {getRelativeDateLabel(task.dueDate, today)}
          </span>
          <span className="created-meta">Added {formatShortDate(task.createdAt)}</span>
        </div>
      </div>
      <div className="task-actions">
        <button
          className="task-action-button"
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          title="Edit task"
        >
          <Pencil size={16} />
        </button>
        <button
          className="task-action-button delete-button"
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}