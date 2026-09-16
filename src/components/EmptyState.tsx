import { Plus } from 'lucide-react';

interface EmptyStateProps {
  hasTasks: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
}

export function EmptyState({ hasTasks, onAdd, onClearFilters }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="emptyCard" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#f1eeff" />
            </linearGradient>
            <linearGradient id="emptyAccent" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7d6bff" />
              <stop offset="1" stopColor="#4d3bd6" />
            </linearGradient>
            <linearGradient id="emptyCheck" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#38c7bb" />
              <stop offset="1" stopColor="#16a37a" />
            </linearGradient>
          </defs>

          <circle cx="66" cy="66" r="52" fill="#eeebff" opacity="0.55" />
          <circle cx="66" cy="66" r="40" fill="#eeebff" opacity="0.9" />

          <g className="float-1">
            <rect
              x="34"
              y="42"
              width="64"
              height="52"
              rx="12"
              fill="url(#emptyCard)"
              stroke="#d7cfff"
              strokeWidth="1.5"
            />
            <rect x="44" y="56" width="34" height="5" rx="2.5" fill="#cfc7f6" />
            <rect x="44" y="67" width="44" height="5" rx="2.5" fill="#e0dbf8" />
            <rect x="44" y="78" width="24" height="5" rx="2.5" fill="#e0dbf8" />
          </g>

          <g className="float-2">
            <rect
              x="72"
              y="26"
              width="34"
              height="34"
              rx="10"
              fill="url(#emptyAccent)"
              opacity="0.95"
            />
            <path
              d="M80 43l6 6 12-13"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          <g>
            <circle cx="34" cy="102" r="11" fill="url(#emptyCheck)" />
            <path
              d="M29 102l3.5 3.5L39.5 99"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </svg>
      </div>

      <h3>
        {hasTasks
          ? 'No tasks match those filters'
          : 'Your list is ready for a fresh start'}
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