import { CalendarDays, Check, Circle, Flag } from 'lucide-react';
import type { TaskStats } from '../types';

interface StatsGridProps {
  stats: TaskStats;
}

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function StatsGrid({ stats }: StatsGridProps) {
  const progressOffset =
    RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, stats.progress)) / 100);

  const statCards = [
    {
      label: 'Total tasks',
      value: stats.total,
      icon: Circle,
      tone: 'violet',
      detail: 'Everything on your plate',
    },
    {
      label: 'In progress',
      value: stats.active,
      icon: Flag,
      tone: 'blue',
      detail: stats.active === 0 ? 'All caught up' : 'Ready for your focus',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: Check,
      tone: 'green',
      detail: `${stats.progress}% of all tasks`,
      ring: true,
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: CalendarDays,
      tone: stats.overdue > 0 ? 'amber' : 'green',
      detail:
        stats.overdue > 0 ? 'Needs your attention' : 'Nothing slipping through',
    },
  ];

  return (
    <section className="stats-grid" aria-label="Task overview">
      {statCards.map(({ label, value, icon: Icon, tone, detail, ring }) => (
        <article className={`stat-card stat-${tone}`} key={label}>
          {ring && (
            <div className="stat-ring" aria-hidden="true">
              <svg viewBox="0 0 40 40">
                <circle className="ring-track" cx="20" cy="20" r={RING_RADIUS} />
                <circle
                  className="ring-fill"
                  cx="20"
                  cy="20"
                  r={RING_RADIUS}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={progressOffset}
                />
              </svg>
            </div>
          )}
          <div className="stat-icon">
            <Icon size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{label}</span>
            <strong>{value}</strong>
            <span className="stat-detail">{detail}</span>
          </div>
        </article>
      ))}
    </section>
  );
}