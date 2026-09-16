import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CornerDownLeft,
  Search,
  type LucideIcon,
} from 'lucide-react';
import type { Task } from '../types';

export interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: LucideIcon;
  perform: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: 'Actions' | 'Tasks';
  perform: () => void;
}

export function CommandPalette({
  open,
  onClose,
  commands,
  tasks,
  onSelectTask,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    setQuery('');
    setActiveIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const normalized = query.trim().toLowerCase();

    const commandItems: PaletteItem[] = commands
      .filter((command) => {
        if (!normalized) {
          return true;
        }
        const haystack =
          `${command.label} ${command.hint ?? ''} ${command.keywords ?? ''}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .map((command) => ({
        id: `cmd-${command.id}`,
        label: command.label,
        hint: command.hint,
        icon: command.icon,
        group: 'Actions',
        perform: command.perform,
      }));

    const taskItems: PaletteItem[] = normalized
      ? tasks
          .filter(
            (task) =>
              task.title.toLowerCase().includes(normalized) ||
              task.tags.some((tag) => tag.toLowerCase().includes(normalized)),
          )
          .slice(0, 6)
          .map((task) => ({
            id: `task-${task.id}`,
            label: task.title,
            hint: task.completed ? 'Completed' : 'Open task',
            icon: Search,
            group: 'Tasks',
            perform: () => onSelectTask(task),
          }))
      : [];

    return [...commandItems, ...taskItems];
  }, [commands, onSelectTask, query, tasks]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) =>
          items.length === 0 ? 0 : (current + 1) % items.length,
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) =>
          items.length === 0 ? 0 : (current - 1 + items.length) % items.length,
        );
        return;
      }

      if (event.key === 'Enter') {
        const item = items[activeIndex];
        if (item) {
          event.preventDefault();
          item.perform();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, items, onClose, open]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop palette-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="palette-search">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands and tasks..."
            aria-label="Command palette input"
          />
          <kbd>Esc</kbd>
        </div>

        <ul className="palette-list" ref={listRef}>
          {items.length === 0 && (
            <li className="palette-empty">No matches found</li>
          )}
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;
            return (
              <li key={item.id} data-active={isActive}>
                <button
                  type="button"
                  className={`palette-item ${isActive ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    item.perform();
                    onClose();
                  }}
                >
                  <span className="palette-icon">
                    <Icon size={16} />
                  </span>
                  <span className="palette-label">{item.label}</span>
                  {item.hint && <span className="palette-hint">{item.hint}</span>}
                  {isActive && (
                    <CornerDownLeft size={14} className="palette-enter" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="palette-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> select
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}