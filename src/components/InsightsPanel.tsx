import { useMemo } from 'react';
import { CheckCircle2, Flame, Timer } from 'lucide-react';
import type { Task } from '../types';
import { toDateInputValue } from '../utils/date';

interface InsightsPanelProps {
  tasks: Task[];
  today: Date;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function InsightsPanel({ tasks, today }: InsightsPanelProps) {
  const insights = useMemo(() => {
    const days: { key: string; label: string; count: number }[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - offset);
      days.push({
        key: toDateInputValue(date),
        label: DAY_LABELS[date.getDay()]!,
        count: 0,
      });
    }

    const dayMap = new Map(days.map((day) => [day.key, day]));

    let totalFocusMinutes = 0;
    let totalFocusSessions = 0;
    let recentlyCompleted = 0;
    const completionDates = new Set<string>();

    for (const task of tasks) {
      totalFocusMinutes += task.focusMinutes;
      totalFocusSessions += task.focusSessions;

      if (typeof task.completedAt === 'number') {
        const key = toDateInputValue(new Date(task.completedAt));
        completionDates.add(key);
        const day = dayMap.get(key);
        if (day) {
          day.count += 1;
          recentlyCompleted += 1;
        }
      }
    }

    // Streak = consecutive days ending today (or yesterday) that had at least
    // one completion. Today isn't required, so the streak doesn't vanish
    // mid-day.
    const todayKey = toDateInputValue(today);
    const cursor = new Date(today);
    if (!completionDates.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    let streak = 0;
    while (completionDates.has(toDateInputValue(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const max = Math.max(1, ...days.map((day) => day.count));

    return {
      days,
      max,
      totalFocusMinutes,
      totalFocusSessions,
      recentlyCompleted,
      streak,
    };
  }, [tasks, today]);

  return (
    <section className="insights-panel" aria-label="Weekly insights">
      <header className="insights-header">
        <div>
          <p className="section-kicker">Last 7 days</p>
          <h3>Weekly insights</h3>
        </div>
      </header>

      <div className="insights-chart">
        {insights.days.map((day) => (
          <div className="insight-bar-wrap" key={day.key}>
            <div
              className="insight-bar"
              style={{
                height: `${Math.max(4, (day.count / insights.max) * 100)}%`,
              }}
              title={`${day.count} completed`}
            >
              {day.count > 0 && <span>{day.count}</span>}
            </div>
            <span className="insight-bar-label">{day.label}</span>
          </div>
        ))}
      </div>

      <div className="insights-stats">
        <div className="insight-stat">
          <CheckCircle2 size={16} />
          <div>
            <strong>{insights.recentlyCompleted}</strong>
            <span>Completed this week</span>
          </div>
        </div>
        <div className="insight-stat">
          <Flame size={16} />
          <div>
            <strong>{insights.streak}</strong>
            <span>Day streak</span>
          </div>
        </div>
        <div className="insight-stat">
          <Timer size={16} />
          <div>
            <strong>{insights.totalFocusMinutes}m</strong>
            <span>{insights.totalFocusSessions} focus sessions</span>
          </div>
        </div>
      </div>
    </section>
  );
}