import { Inbox, Plus } from 'lucide-react';

interface EmptyStateProps {
  hasTasks: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
}

export function EmptyState({ hasTasks, onAdd, onClearFilters }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={24} />
      </div>
      <h3>
        {hasTasks ? 'No tasks match those filters' : 'Your list is ready for a fresh start'}
      </h3>
      <p>
        {hasTasks
          ? 'Try a different search or clear a filter to see more.'
          : 'Add your first task and give your next goal a home.'}
      </p>
      {hasTasks ? (
        <button className="secondary-button" type="button" onClick={onClearFilters}>
          Clear filters
        </button>
      ) : (
        <button className="primary-button" type="button" onClick={onAdd}>
          <Plus size={17} />
          Add your first task
        </button>
      )}
    </div>
  );
}