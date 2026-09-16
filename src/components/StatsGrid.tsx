import { CalendarDays, Check, Circle, Flag } from 'lucide-react';
import type { TaskStats } from '../types';

interface StatsGridProps {
  stats: TaskStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
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
      detail: 'Ready for your focus',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: Check,
      tone: 'green',
      detail: `${stats.progress}% of all tasks`,
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: CalendarDays,
      tone: stats.overdue > 0 ? 'amber' : 'green',
      detail: stats.overdue > 0 ? 'Needs your attention' : 'Nothing slipping through',
    },
  ];

  return (
    <section className="stats-grid" aria-label="Task overview">
      {statCards.map(({ label, value, icon: Icon, tone, detail }) => (
        <article className={`stat-card stat-${tone}`} key={label}>
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