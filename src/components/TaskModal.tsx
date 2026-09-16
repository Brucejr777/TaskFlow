import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Flag, Pencil, Pin, Plus, Repeat, Trash2, X } from 'lucide-react';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_SUBTASK_MAX_COUNT,
  TASK_SUBTASK_MAX_LENGTH,
  TASK_TAG_MAX_COUNT,
  TASK_TAG_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  priorityLabels,
  priorityOptions,
  recurrenceLabels,
  recurrenceOptions,
} from '../constants';
import type { Subtask, Task, TaskFormValues } from '../types';
import { toDateInputValue } from '../utils/date';
import { createId } from '../utils/id';
import { getTagTone, normalizeTag } from '../utils/tags';

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
  tags: [],
  subtasks: [],
  recurrence: 'none',
  pinned: false,
});

export function TaskModal({ open, task, onClose, onSave }: TaskModalProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(createEmptyForm);
  const [formError, setFormError] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');
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
            tags: [...task.tags],
            subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
            recurrence: task.recurrence,
            pinned: task.pinned,
          }
        : createEmptyForm(),
    );
    setFormError('');
    setTagDraft('');
    setSubtaskDraft('');
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

    onSave(
      {
        ...formValues,
        title,
        description,
        tags: formValues.tags.map(normalizeTag).filter(Boolean),
        subtasks: formValues.subtasks
          .map((subtask) => ({
            ...subtask,
            title: subtask.title.trim(),
          }))
          .filter((subtask) => subtask.title.length > 0),
      },
      task?.id,
    );
  };

  const addTag = () => {
    const nextTag = normalizeTag(tagDraft).slice(0, TASK_TAG_MAX_LENGTH);
    if (!nextTag) {
      return;
    }
    if (formValues.tags.length >= TASK_TAG_MAX_COUNT) {
      return;
    }
    if (
      formValues.tags.some(
        (existing) => existing.toLowerCase() === nextTag.toLowerCase(),
      )
    ) {
      setTagDraft('');
      return;
    }
    setFormValues({ ...formValues, tags: [...formValues.tags, nextTag] });
    setTagDraft('');
  };

  const removeTag = (tag: string) => {
    setFormValues({
      ...formValues,
      tags: formValues.tags.filter((existing) => existing !== tag),
    });
  };

  const handleTagKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Backspace' && !tagDraft && formValues.tags.length > 0) {
      removeTag(formValues.tags[formValues.tags.length - 1]!);
    }
  };

  const addSubtask = () => {
    const title = subtaskDraft.trim().slice(0, TASK_SUBTASK_MAX_LENGTH);
    if (!title) {
      return;
    }
    if (formValues.subtasks.length >= TASK_SUBTASK_MAX_COUNT) {
      return;
    }
    const nextSubtask: Subtask = { id: createId(), title, done: false };
    setFormValues({
      ...formValues,
      subtasks: [...formValues.subtasks, nextSubtask],
    });
    setSubtaskDraft('');
  };

  const handleSubtaskKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSubtask();
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    setFormValues({
      ...formValues,
      subtasks: formValues.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
      ),
    });
  };

  const updateSubtaskTitle = (subtaskId: string, title: string) => {
    setFormValues({
      ...formValues,
      subtasks: formValues.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, title } : subtask,
      ),
    });
  };

  const removeSubtask = (subtaskId: string) => {
    setFormValues({
      ...formValues,
      subtasks: formValues.subtasks.filter((subtask) => subtask.id !== subtaskId),
    });
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

          <div className="form-field">
            <span>Tags</span>
            {formValues.tags.length > 0 && (
              <div className="tag-editor-list">
                {formValues.tags.map((tag) => (
                  <span className={`tag-chip tag-tone-${getTagTone(tag)}`} key={tag}>
                    {tag}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="inline-input-row">
              <input
                type="text"
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={
                  formValues.tags.length >= TASK_TAG_MAX_COUNT
                    ? `Tag limit reached (${TASK_TAG_MAX_COUNT})`
                    : 'Add a tag and press Enter'
                }
                maxLength={TASK_TAG_MAX_LENGTH}
                disabled={formValues.tags.length >= TASK_TAG_MAX_COUNT}
              />
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={addTag}
                disabled={
                  !tagDraft.trim() ||
                  formValues.tags.length >= TASK_TAG_MAX_COUNT
                }
              >
                Add
              </button>
            </div>
          </div>

          <div className="form-field">
            <span>Subtasks</span>
            {formValues.subtasks.length > 0 && (
              <ul className="subtask-editor">
                {formValues.subtasks.map((subtask) => (
                  <li key={subtask.id} className="subtask-editor-row">
                    <button
                      type="button"
                      className={`subtask-check ${subtask.done ? 'is-done' : ''}`}
                      onClick={() => toggleSubtask(subtask.id)}
                      aria-pressed={subtask.done}
                      aria-label={
                        subtask.done
                          ? `Mark ${subtask.title} as not done`
                          : `Mark ${subtask.title} as done`
                      }
                    >
                      {subtask.done ? '✓' : ''}
                    </button>
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(event) =>
                        updateSubtaskTitle(subtask.id, event.target.value)
                      }
                      maxLength={TASK_SUBTASK_MAX_LENGTH}
                    />
                    <button
                      type="button"
                      className="task-action-button delete-button"
                      onClick={() => removeSubtask(subtask.id)}
                      aria-label={`Remove subtask ${subtask.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="inline-input-row">
              <input
                type="text"
                value={subtaskDraft}
                onChange={(event) => setSubtaskDraft(event.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder={
                  formValues.subtasks.length >= TASK_SUBTASK_MAX_COUNT
                    ? `Subtask limit reached (${TASK_SUBTASK_MAX_COUNT})`
                    : 'Add a subtask and press Enter'
                }
                maxLength={TASK_SUBTASK_MAX_LENGTH}
                disabled={formValues.subtasks.length >= TASK_SUBTASK_MAX_COUNT}
              />
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={addSubtask}
                disabled={
                  !subtaskDraft.trim() ||
                  formValues.subtasks.length >= TASK_SUBTASK_MAX_COUNT
                }
              >
                Add
              </button>
            </div>
          </div>

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

          <div className="form-row">
            <label className="form-field">
              <span>Repeat</span>
              <div className="select-with-icon">
                <Repeat size={15} aria-hidden="true" />
                <select
                  value={formValues.recurrence}
                  onChange={(event) =>
                    setFormValues({
                      ...formValues,
                      recurrence: event.target
                        .value as TaskFormValues['recurrence'],
                    })
                  }
                >
                  {recurrenceOptions.map((option) => (
                    <option value={option} key={option}>
                      {recurrenceLabels[option]}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <div className="form-field">
              <span>Pin</span>
              <button
                type="button"
                className={`pin-toggle ${formValues.pinned ? 'is-pinned' : ''}`}
                onClick={() =>
                  setFormValues({ ...formValues, pinned: !formValues.pinned })
                }
                aria-pressed={formValues.pinned}
              >
                <Pin size={15} />
                {formValues.pinned ? 'Pinned to top' : 'Not pinned'}
              </button>
            </div>
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