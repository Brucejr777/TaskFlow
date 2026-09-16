import { CalendarDays, Check, Moon, Sun } from 'lucide-react';
import { useToday } from '../hooks/useToday';
import type { Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

const headerDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const today = useToday();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <Check size={21} strokeWidth={3} />
        </div>
        <div>
          <div className="brand-name">TaskFlow</div>
          <div className="brand-tagline">Make space for what matters</div>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="date-chip">
          <CalendarDays size={15} />
          <span>{headerDateFormatter.format(today)}</span>
        </div>
        <button
          className="icon-button theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}