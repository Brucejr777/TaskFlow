import { useRef, useState, type KeyboardEvent } from 'react';
import { CornerDownLeft, Plus } from 'lucide-react';
import { TASK_TITLE_MAX_LENGTH } from '../constants';

interface QuickAddProps {
  onAdd: (title: string) => void;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const title = value.trim();
    if (!title) {
      return;
    }
    onAdd(title);
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
        placeholder="Quick add a task and press Enter"
        maxLength={TASK_TITLE_MAX_LENGTH}
        aria-label="Quick add task"
      />
      {value && (
        <button type="button" className="quick-add-submit" onClick={submit}>
          Add
          <CornerDownLeft size={12} />
        </button>
      )}
    </div>
  );
}