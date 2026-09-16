import { useMemo, useState, type DragEvent } from 'react';
import { CalendarDays, Flag, Pin, Plus, Timer } from 'lucide-react';
import { priorityLabels, taskStatusLabels } from '../constants';
import type { Task, TaskStatus } from '../types';
import { getRelativeDateLabel } from '../utils/date';
import { getTagTone } from '../utils/tags';

interface BoardViewProps {
  tasks: Task[];
  today: Date;
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onCreateInColumn: (status: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

export function BoardView({
  tasks,
  today,
  onSelectTask,
  onMoveTask,
  onCreateInColumn,
}: BoardViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<TaskStatus | null>(null);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    };

    for (const task of tasks) {
      // Completed tasks are always rendered in the "done" column even if their
      // stored status lags behind (e.g. older payloads).
      const column: TaskStatus = task.completed ? 'done' : task.status;
      map[column].push(task);
    }

    return map;
  }, [tasks]);

  const handleDragStart = (event: DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggingId(taskId);
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, column: TaskStatus) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (hoverColumn !== column) {
      setHoverColumn(column);
    }
  };

  const handleDragLeave = (
    event: DragEvent<HTMLElement>,
    column: TaskStatus,
  ) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    if (hoverColumn === column) {
      setHoverColumn(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>, column: TaskStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggingId;
    if (taskId) {
      onMoveTask(taskId, column);
    }
    setDraggingId(null);
    setHoverColumn(null);
  };

  return (
    <div className="board-view">
      {COLUMNS.map((column) => {
        const columnTasks = grouped[column];
        const isTarget = hoverColumn === column;

        return (
          <section
            key={column}
            className={`board-column ${isTarget ? 'is-drop-target' : ''}`}
            onDragOver={(event) => handleDragOver(event, column)}
            onDragLeave={(event) => handleDragLeave(event, column)}
            onDrop={(event) => handleDrop(event, column)}
            aria-label={`${taskStatusLabels[column]} column`}
          >
            <header className="board-column-header">
              <div className="board-column-title">
                <span className={`board-status-dot status-${column}`} />
                <h3>{taskStatusLabels[column]}</h3>
                <span className="board-count">{columnTasks.length}</span>
              </div>
              <button
                className="icon-button board-add-button"
                type="button"
                onClick={() => onCreateInColumn(column)}
                aria-label={`Add task to ${taskStatusLabels[column]}`}
                title={`Add task to ${taskStatusLabels[column]}`}
              >
                <Plus size={15} />
              </button>
            </header>

            <div className="board-column-body">
              {columnTasks.length === 0 ? (
                <p className="board-empty">Drop tasks here</p>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`board-card priority-${task.priority} ${
                      draggingId === task.id ? 'is-dragging' : ''
                    }`}
                    draggable
                    onDragStart={(event) => handleDragStart(event, task.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setHoverColumn(null);
                    }}
                    onClick={() => onSelectTask(task)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectTask(task);
                      }
                    }}
                  >
                    <div className="board-card-head">
                      {task.pinned && (
                        <Pin size={12} className="pinned-icon" aria-hidden />
                      )}
                      <h4>{task.title}</h4>
                    </div>

                    {task.tags.length > 0 && (
                      <div className="board-card-tags">
                        {task.tags.slice(0, 3).map((tag) => (
                          <span
                            className={`tag-chip tag-tone-${getTagTone(tag)}`}
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="board-card-meta">
                      <span className={`priority-badge priority-${task.priority}`}>
                        <Flag size={11} />
                        {priorityLabels[task.priority]}
                      </span>
                      {task.dueDate && (
                        <span className="board-due">
                          <CalendarDays size={12} />
                          {getRelativeDateLabel(task.dueDate, today)}
                        </span>
                      )}
                      {task.focusSessions > 0 && (
                        <span className="focus-badge">
                          <Timer size={11} />
                          {task.focusSessions}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}