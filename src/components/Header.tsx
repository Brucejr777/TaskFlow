import { useRef } from 'react';
import {
  CalendarDays,
  Check,
  Command,
  Download,
  Keyboard,
  Moon,
  Sun,
  Upload,
} from 'lucide-react';
import { useToday } from '../hooks/useToday';
import type { Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onShowShortcuts: () => void;
  onOpenPalette: () => void;
}

const headerDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

export function Header({
  theme,
  onToggleTheme,
  onExport,
  onImport,
  onShowShortcuts,
  onOpenPalette,
}: HeaderProps) {
  const today = useToday();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <Check size={22} strokeWidth={3} />
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
          className="palette-trigger"
          type="button"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          title="Open command palette (Ctrl/Cmd+K)"
        >
          <Command size={15} />
          <span>Search or run a command</span>
          <kbd>⌘K</kbd>
        </button>

        <div className="header-icon-group">
          <button
            className="icon-button"
            type="button"
            onClick={onShowShortcuts}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={onExport}
            aria-label="Export tasks"
            title="Export tasks as JSON"
          >
            <Download size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Import tasks"
            title="Import tasks from JSON"
          >
            <Upload size={18} />
          </button>
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

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImport(file);
            }
            event.target.value = '';
          }}
        />
      </div>
    </header>
  );
}