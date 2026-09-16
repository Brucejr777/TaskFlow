import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Flag, Pencil, Plus, X } from 'lucide-react';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  priorityLabels,
  priorityOptions,
} from '../constants';
import type { Task, TaskFormValues } from '../types';
import { toDateInputValue } from '../utils/date';

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (values: TaskFormValues, taskId?: string) => void;
}

const createEmptyForm = (): TaskFormValues => ({
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
});

export function TaskModal({ open, task, onClose, onSave }: TaskModalProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(createEmptyForm);
  const [formError, setFormError] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const todayInput = useMemo(() => toDateInputValue(new Date()), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(
      task
        ? {
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
          }
        : createEmptyForm(),
    );
    setFormError('');
  }, [open, task]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => titleInputRef.current?.focus(), 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) {
        return;
      }

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute('disabled') && element.offsetParent !== null,
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = formValues.title.trim();
    const description = formValues.description.trim();

    if (!title) {
      setFormError('Please give your task a title.');
      titleInputRef.current?.focus();
      return;
    }

    onSave({ ...formValues, title, description }, task?.id);
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
      >
        <div className="modal-header">
          <div>
            <p className="modal-kicker">{task ? 'Update task' : 'Create a task'}</p>
            <h2 id="modal-title">{task ? 'Edit your task' : 'Add a new task'}</h2>
          </div>
          <button
            className="icon-button modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>
              Title <b>*</b>
            </span>
            <input
              ref={titleInputRef}
              type="text"
              value={formValues.title}
              onChange={(event) =>
                setFormValues({ ...formValues, title: event.target.value })
              }
              placeholder="e.g. Review the project brief"
              maxLength={TASK_TITLE_MAX_LENGTH}
            />
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea
              value={formValues.description}
              onChange={(event) =>
                setFormValues({ ...formValues, description: event.target.value })
              }
              placeholder="Add context, links, or next steps..."
              rows={4}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Priority</span>
              <div className="priority-options">
                {priorityOptions.map((priority) => (
                  <button
                    type="button"
                    className={`priority-option priority-${priority} ${
                      formValues.priority === priority ? 'is-selected' : ''
                    }`}
                    key={priority}
                    onClick={() => setFormValues({ ...formValues, priority })}
                  >
                    <Flag size={14} />
                    {priorityLabels[priority]}
                  </button>
                ))}
              </div>
            </label>
            <label className="form-field">
              <span>Due date</span>
              <input
                type="date"
                value={formValues.dueDate}
                min={task ? undefined : todayInput}
                onChange={(event) =>
                  setFormValues({ ...formValues, dueDate: event.target.value })
                }
              />
            </label>
          </div>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              {task ? <Pencil size={17} /> : <Plus size={17} />}
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}