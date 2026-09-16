import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts: { keys: string[]; label: string }[] = [
  { keys: ['N'], label: 'Create a new task' },
  { keys: ['/'], label: 'Focus the search field' },
  { keys: ['?'], label: 'Show this shortcut list' },
  { keys: ['Esc'], label: 'Close dialogs / exit selection mode' },
  { keys: ['Tab'], label: 'Cycle through focusable controls' },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div
        className="task-modal shortcuts-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="modal-header">
          <div>
            <p className="modal-kicker">Keyboard</p>
            <h2 id="shortcuts-title">Shortcuts</h2>
          </div>
          <button
            className="icon-button modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        <ul className="shortcut-list">
          {shortcuts.map(({ keys, label }) => (
            <li key={label}>
              <span className="shortcut-keys">
                {keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </span>
              <span className="shortcut-label">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}