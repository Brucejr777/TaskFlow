import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, CornerDownLeft, Plus } from 'lucide-react';
import { TASK_TITLE_MAX_LENGTH } from '../constants';
import { formatDate } from '../utils/date';
import { parseNaturalDate } from '../utils/naturalDate';

interface QuickAddProps {
  onAdd: (title: string, dueDate?: string) => void;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(
    () => (value.trim() ? parseNaturalDate(value) : null),
    [value],
  );

  const submit = () => {
    const raw = value.trim();
    if (!raw) {
      return;
    }

    const detection = parseNaturalDate(raw);
    const title = detection ? detection.rest : raw;
    const dueDate = detection?.dueDate;

    if (!title) {
      return;
    }

    onAdd(title, dueDate);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setValue('');
      inputRef.current?.blur();
    }
  };

  const expanded = focused || value.length > 0;

  return (
    <div className={`quick-add ${expanded ? 'is-expanded' : ''}`}>
      <div className="quick-add-row">
        <span className="quick-add-icon" aria-hidden="true">
          <Plus size={16} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Quick add — try “call mom tomorrow”"
          maxLength={TASK_TITLE_MAX_LENGTH + 40}
          aria-label="Quick add task"
        />
        {value && (
          <button type="button" className="quick-add-submit" onClick={submit}>
            Add
            <CornerDownLeft size={12} />
          </button>
        )}
      </div>
      {parsed && (
        <span className="quick-add-preview">
          <CalendarDays size={12} />
          Due {formatDate(parsed.dueDate)}
        </span>
      )}
    </div>
  );
}