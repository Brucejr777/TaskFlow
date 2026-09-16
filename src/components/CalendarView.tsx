import { useMemo, useState } from 'react';
import { CalendarOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { priorityLabels } from '../constants';
import type { Task } from '../types';
import { toDateInputValue } from '../utils/date';

interface CalendarViewProps {
  tasks: Task[];
  today: Date;
  onSelectTask: (task: Task) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ tasks, today, onSelectTask }: CalendarViewProps) {
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const { tasksByDate, unscheduled } = useMemo(() => {
    const map = new Map<string, Task[]>();
    const noDate: Task[] = [];
    for (const task of tasks) {
      if (!task.dueDate) {
        noDate.push(task);
        continue;
      }
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    return { tasksByDate: map, unscheduled: noDate };
  }, [tasks]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    const items: { date: Date; inMonth: boolean }[] = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      items.push({ date, inMonth: date.getMonth() === month });
    }
    return items;
  }, [cursor]);

  const monthLabel = cursor.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const todayKey = toDateInputValue(today);

  const shiftMonth = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button
          className="icon-button"
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h3>{monthLabel}</h3>
        <button
          className="icon-button"
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-grid calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar-grid" role="grid">
        {cells.map(({ date, inMonth }) => {
          const key = toDateInputValue(date);
          const dayTasks = tasksByDate.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              role="gridcell"
              className={`calendar-cell ${inMonth ? '' : 'is-outside'} ${
                isToday ? 'is-today' : ''
              }`}
            >
              <div className="calendar-cell-head">
                <span className="calendar-day">{date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <span className="calendar-count">{dayTasks.length}</span>
                )}
              </div>
              <div className="calendar-tasks">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`calendar-task priority-${task.priority} ${
                      task.completed ? 'is-completed' : ''
                    }`}
                    onClick={() => onSelectTask(task)}
                    title={`${task.title} · ${priorityLabels[task.priority]}`}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="calendar-more">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <section
          className="calendar-unscheduled"
          aria-label="Unscheduled tasks"
        >
          <header className="calendar-unscheduled-header">
            <CalendarOff size={15} />
            <span>Unscheduled</span>
            <span className="calendar-count">{unscheduled.length}</span>
          </header>
          <div className="calendar-unscheduled-list">
            {unscheduled.map((task) => (
              <button
                key={task.id}
                type="button"
                className={`calendar-task priority-${task.priority} ${
                  task.completed ? 'is-completed' : ''
                }`}
                onClick={() => onSelectTask(task)}
                title={`${task.title} · ${priorityLabels[task.priority]}`}
              >
                {task.title}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}