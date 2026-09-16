import { Archive, Check, Trash2, X, ListChecks } from 'lucide-react';

interface SelectionBarProps {
  count: number;
  total: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onComplete: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function SelectionBar({
  count,
  total,
  onSelectAll,
  onClearSelection,
  onComplete,
  onArchive,
  onDelete,
  onCancel,
}: SelectionBarProps) {
  return (
    <div className="selection-bar" role="region" aria-label="Bulk task actions">
      <div className="selection-summary">
        <ListChecks size={18} />
        <span>
          <strong>{count}</strong> of {total} selected
        </span>
      </div>
      <div className="selection-actions">
        {count < total ? (
          <button type="button" className="ghost-button" onClick={onSelectAll}>
            Select all
          </button>
        ) : (
          <button type="button" className="ghost-button" onClick={onClearSelection}>
            Clear selection
          </button>
        )}
        <button
          type="button"
          className="secondary-button"
          onClick={onComplete}
          disabled={count === 0}
        >
          <Check size={16} />
          Complete
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onArchive}
          disabled={count === 0}
        >
          <Archive size={16} />
          Archive
        </button>
        <button
          type="button"
          className="danger-button"
          onClick={onDelete}
          disabled={count === 0}
        >
          <Trash2 size={16} />
          Delete
        </button>
        <button
          type="button"
          className="icon-button selection-cancel"
          onClick={onCancel}
          aria-label="Exit selection mode"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}