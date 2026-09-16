import { memo } from 'react';
import {
  CalendarDays,
  Check,
  Flag,
  Pencil,
  Pin,
  Play,
  Repeat,
  Timer,
  Trash2,
} from 'lucide-react';
import { priorityLabels, recurrenceShortLabels } from '../constants';
import type { Task } from '../types';
import { formatShortDate, getRelativeDateLabel, isOverdue } from '../utils/date';
import { getTagTone } from '../utils/tags';

interface TaskCardProps {
  task: Task;
  today: Date;
  selectionMode: boolean;
  selected: boolean;
  onToggle: (taskId: string) => void;
  onToggleSelection: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onTogglePin: (taskId: string) => void;
  onStartFocus: (task: Task) => void;
}

function TaskCardComponent({
  task,
  today,
  selectionMode,
  selected,
  onToggle,
  onToggleSelection,
  onEdit,
  onDelete,
  onTogglePin,
  onStartFocus,
}: TaskCardProps) {
  const overdueTask = isOverdue(task, today);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;
  const subtaskProgress =
    task.subtasks.length === 0
      ? 0
      : Math.round((doneSubtasks / task.subtasks.length) * 100);

  return (
    <article
      className={`task-card priority-${task.priority} ${
        task.completed ? 'is-completed' : ''
      } ${overdueTask ? 'is-overdue' : ''} ${
        selectionMode ? 'is-selecting' : ''
      } ${selected ? 'is-selected' : ''}`}
      onClick={selectionMode ? () => onToggleSelection(task.id) : undefined}
    >
      {selectionMode ? (
        <button
          className={`select-toggle ${selected ? 'is-checked' : ''}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelection(task.id);
          }}
          aria-label={selected ? `Deselect ${task.title}` : `Select ${task.title}`}
          aria-pressed={selected}
        >
          {selected && <Check size={15} strokeWidth={3} />}
        </button>
      ) : (
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
      )}

      <div className="task-card-content">
        <div className="task-title-row">
          <h3>
            {task.pinned && <Pin size={13} className="pinned-icon" aria-hidden />}
            {task.title}
          </h3>
          <div className="task-badges">
            {task.focusSessions > 0 && (
              <span
                className="focus-badge"
                title={`${task.focusSessions} focus ${
                  task.focusSessions === 1 ? 'session' : 'sessions'
                } · ${task.focusMinutes} minutes`}
              >
                <Timer size={11} />
                {task.focusSessions}
              </span>
            )}
            {task.recurrence !== 'none' && (
              <span
                className="recurrence-badge"
                title={recurrenceShortLabels[task.recurrence]}
              >
                <Repeat size={11} />
                {recurrenceShortLabels[task.recurrence]}
              </span>
            )}
            <span className={`priority-badge priority-${task.priority}`}>
              <Flag size={12} />
              {priorityLabels[task.priority]}
            </span>
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="tag-list">
            {task.tags.map((tag) => (
              <span className={`tag-chip tag-tone-${getTagTone(tag)}`} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        {task.subtasks.length > 0 && (
          <div className="subtask-summary">
            <div className="subtask-track">
              <div
                className="subtask-fill"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
            <span>
              {doneSubtasks}/{task.subtasks.length} subtasks
            </span>
          </div>
        )}

        <div className="task-meta">
          <span className={`due-meta ${overdueTask ? 'due-overdue' : ''}`}>
            <CalendarDays size={14} />
            {getRelativeDateLabel(task.dueDate, today)}
          </span>
          <span className="created-meta">Added {formatShortDate(task.createdAt)}</span>
        </div>
      </div>

      {!selectionMode && (
        <div className="task-actions">
          {!task.completed && (
            <button
              className="task-action-button focus-button"
              type="button"
              onClick={() => onStartFocus(task)}
              aria-label={`Start focus session for ${task.title}`}
              title="Start focus session"
            >
              <Play size={15} />
            </button>
          )}
          <button
            className={`task-action-button pin-button ${task.pinned ? 'is-pinned' : ''}`}
            type="button"
            onClick={() => onTogglePin(task.id)}
            aria-label={task.pinned ? `Unpin ${task.title}` : `Pin ${task.title}`}
            aria-pressed={task.pinned}
            title={task.pinned ? 'Unpin task' : 'Pin task'}
          >
            <Pin size={16} />
          </button>
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
      )}
    </article>
  );
}

export const TaskCard = memo(TaskCardComponent);