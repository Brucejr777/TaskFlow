import { ArrowUpDown, Filter, Flag, Search, X } from 'lucide-react';
import { priorityLabels, sortOptions, statusOptions } from '../constants';
import type { Priority, SortOption, StatusFilter } from '../types';

interface TaskControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  priorityFilter: Priority | 'all';
  onPriorityFilterChange: (value: Priority | 'all') => void;
  sortOption: SortOption;
  onSortOptionChange: (value: SortOption) => void;
}

export function TaskControls({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortOption,
  onSortOptionChange,
}: TaskControlsProps) {
  return (
    <div className="task-controls">
      <label className="search-field">
        <Search size={17} />
        <span className="sr-only">Search tasks</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search tasks..."
        />
        {search && (
          <button
            type="button"
            className="clear-search"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </label>
      <div className="filter-group" aria-label="Task filters">
        <div className="filter-select-wrap">
          <Filter size={15} />
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            {statusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-select-wrap">
          <Flag size={15} />
          <select
            value={priorityFilter}
            onChange={(event) =>
              onPriorityFilterChange(event.target.value as Priority | 'all')
            }
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            {(['high', 'medium', 'low'] as Priority[]).map((priority) => (
              <option value={priority} key={priority}>
                {priorityLabels[priority]} priority
              </option>
            ))}
          </select>
        </div>
        <div className="filter-select-wrap sort-select-wrap">
          <ArrowUpDown size={15} />
          <select
            value={sortOption}
            onChange={(event) => onSortOptionChange(event.target.value as SortOption)}
            aria-label="Sort tasks"
          >
            {sortOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}