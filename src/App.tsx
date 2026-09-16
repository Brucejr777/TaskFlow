import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { ProgressFooter } from './components/ProgressFooter';
import { SelectionBar } from './components/SelectionBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { StatsGrid } from './components/StatsGrid';
import { TaskControls } from './components/TaskControls';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';
import { ToastViewport } from './components/Toast';
import { STORAGE_KEY } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { useToasts } from './hooks/useToasts';
import { useToday } from './hooks/useToday';
import type {
  Priority,
  SortOption,
  StatusFilter,
  Task,
  TaskFormValues,
} from './types';
import { getNextDueDate } from './utils/date';
import { downloadTasks, extractTasksFromImport } from './utils/export';
import { filterAndSortTasks } from './utils/filters';
import { createId } from './utils/id';
import { getTaskStats } from './utils/stats';
import { parseTasks } from './utils/validation';

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
};

/** Marks the given tasks as completed, spawning the next occurrence for recurring ones. */
const applyCompletion = (tasks: Task[], ids: Set<string>): Task[] => {
  const spawned: Task[] = [];

  const updated = tasks.map((task) => {
    if (!ids.has(task.id) || task.completed) {
      return task;
    }

    if (task.recurrence !== 'none') {
      spawned.push({
        ...task,
        id: createId(),
        completed: false,
        createdAt: Date.now(),
        updatedAt: undefined,
        dueDate: getNextDueDate(task.dueDate, task.recurrence),
        subtasks: task.subtasks.map((subtask) => ({ ...subtask, done: false })),
      });
    }

    return { ...task, completed: true, updatedAt: Date.now() };
  });

  return [...spawned, ...updated];
};

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEY, [], parseTasks);
  const [theme, setTheme] = useTheme();
  const today = useToday();
  const { toasts, push, dismiss } = useToasts();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => getTaskStats(tasks, today), [tasks, today]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks) {
      for (const tag of task.tags) {
        set.add(tag);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const filteredTasks = useMemo(
    () =>
      filterAndSortTasks(tasks, {
        search: deferredSearch,
        statusFilter,
        priorityFilter,
        tagFilter,
        sortOption,
        today,
      }),
    [tasks, deferredSearch, statusFilter, priorityFilter, tagFilter, sortOption, today],
  );

  const openNewTask = useCallback(() => {
    setEditingTask(null);
    setFormOpen(true);
  }, []);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setFormOpen(false);
    setEditingTask(null);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((taskId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(filteredTasks.map((task) => task.id)));
  }, [filteredTasks]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const togglePin = useCallback(
    (taskId: string) => {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, pinned: !task.pinned } : task,
        ),
      );
    },
    [setTasks],
  );

  const handleExport = useCallback(() => {
    if (tasks.length === 0) {
      push('Nothing to export yet', { kind: 'info' });
      return;
    }
    downloadTasks(tasks);
    push(
      `Exported ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`,
      { kind: 'success' },
    );
  }, [push, tasks]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text) as unknown;
        const candidate = extractTasksFromImport(data);
        const imported = candidate === null ? null : parseTasks(candidate);

        if (!imported || imported.length === 0) {
          push('No valid tasks found in that file', { kind: 'error' });
          return;
        }

        setTasks((current) => {
          const merged = new Map(current.map((task) => [task.id, task]));
          for (const task of imported) {
            merged.set(task.id, task);
          }
          return Array.from(merged.values());
        });

        push(
          `Imported ${imported.length} ${imported.length === 1 ? 'task' : 'tasks'}`,
          { kind: 'success' },
        );
      } catch {
        push('Could not read that file', { kind: 'error' });
      }
    },
    [push, setTasks],
  );

  // Global keyboard shortcuts.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (formOpen || shortcutsOpen) {
        return;
      }

      if (event.key === 'Escape' && selectionMode) {
        event.preventDefault();
        exitSelectionMode();
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === 'n') {
        event.preventDefault();
        setEditingTask(null);
        setFormOpen(true);
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (event.key === '/') {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitSelectionMode, formOpen, selectionMode, shortcutsOpen]);

  const saveTask = useCallback(
    (values: TaskFormValues, taskId?: string) => {
      if (taskId) {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === taskId
              ? { ...task, ...values, updatedAt: Date.now() }
              : task,
          ),
        );
        push('Task updated', { kind: 'success' });
      } else {
        const newTask: Task = {
          id: createId(),
          ...values,
          completed: false,
          createdAt: Date.now(),
        };
        setTasks((currentTasks) => [newTask, ...currentTasks]);
        push('Task created', { kind: 'success' });
      }

      closeModal();
    },
    [closeModal, push, setTasks],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      setTasks((currentTasks) => {
        const target = currentTasks.find((task) => task.id === taskId);
        if (!target) {
          return currentTasks;
        }

        if (target.completed) {
          return currentTasks.map((task) =>
            task.id === taskId
              ? { ...task, completed: false, updatedAt: Date.now() }
              : task,
          );
        }

        return applyCompletion(currentTasks, new Set([taskId]));
      });
    },
    [setTasks],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const target = tasks.find((task) => task.id === taskId);
      if (!target) {
        return;
      }

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));

      push('Task deleted', {
        kind: 'info',
        actionLabel: 'Undo',
        onAction: () => setTasks((currentTasks) => [target, ...currentTasks]),
      });
    },
    [push, setTasks, tasks],
  );

  const bulkComplete = useCallback(() => {
    if (selectedIds.size === 0) {
      return;
    }
    const count = selectedIds.size;
    setTasks((currentTasks) => applyCompletion(currentTasks, selectedIds));
    push(
      `Completed ${count} ${count === 1 ? 'task' : 'tasks'}`,
      { kind: 'success' },
    );
    exitSelectionMode();
  }, [exitSelectionMode, push, selectedIds, setTasks]);

  const bulkDelete = useCallback(() => {
    if (selectedIds.size === 0) {
      return;
    }
    const removed = tasks.filter((task) => selectedIds.has(task.id));
    const count = removed.length;
    setTasks((currentTasks) =>
      currentTasks.filter((task) => !selectedIds.has(task.id)),
    );
    push(
      `Deleted ${count} ${count === 1 ? 'task' : 'tasks'}`,
      {
        kind: 'info',
        actionLabel: 'Undo',
        onAction: () =>
          setTasks((currentTasks) => [...removed, ...currentTasks]),
      },
    );
    exitSelectionMode();
  }, [exitSelectionMode, push, selectedIds, setTasks, tasks]);

  const clearCompleted = useCallback(() => {
    const removed = tasks.filter((task) => task.completed);
    if (removed.length === 0) {
      return;
    }

    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));

    push(
      `Cleared ${removed.length} completed ${
        removed.length === 1 ? 'task' : 'tasks'
      }`,
      {
        kind: 'info',
        actionLabel: 'Undo',
        onAction: () => setTasks((currentTasks) => [...removed, ...currentTasks]),
      },
    );
  }, [push, setTasks, tasks]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTagFilter('');
  }, []);

  return (
    <div className={`app-shell ${selectionMode ? 'has-selection-bar' : ''}`}>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onExport={handleExport}
        onImport={handleImport}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      <main className="page-container">
        <section className="hero-section" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Your personal command center</p>
            <h1 id="page-title">
              Stay organized.
              <br />
              <span>Move forward.</span>
            </h1>
            <p className="hero-copy">
              Capture the work ahead, keep deadlines in sight, and turn busy days
              into clear next steps.
            </p>
          </div>
          <button
            className="primary-button hero-action"
            type="button"
            onClick={openNewTask}
          >
            <Plus size={18} />
            <span>Add a task</span>
          </button>
        </section>

        <StatsGrid stats={stats} />

        <section className="workspace-section" aria-labelledby="tasks-heading">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Task list</p>
              <h2 id="tasks-heading">Your tasks</h2>
            </div>
            <div className="section-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={enterSelectionMode}
                disabled={filteredTasks.length === 0 || selectionMode}
              >
                <ListChecks size={17} />
                Select
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={openNewTask}
              >
                <Plus size={17} />
                New task
              </button>
            </div>
          </div>

          <TaskControls
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            allTags={allTags}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
          />

          {filteredTasks.length > 0 ? (
            <TaskList
              tasks={filteredTasks}
              today={today}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggle={toggleTask}
              onToggleSelection={toggleSelection}
              onEdit={openEditTask}
              onDelete={deleteTask}
              onTogglePin={togglePin}
            />
          ) : (
            <EmptyState
              hasTasks={tasks.length > 0}
              onAdd={openNewTask}
              onClearFilters={clearFilters}
            />
          )}

          <ProgressFooter stats={stats} onClearCompleted={clearCompleted} />
        </section>
      </main>

      <TaskModal
        open={formOpen}
        task={editingTask}
        onClose={closeModal}
        onSave={saveTask}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {selectionMode && (
        <SelectionBar
          count={selectedIds.size}
          total={filteredTasks.length}
          onSelectAll={selectAllVisible}
          onClearSelection={clearSelection}
          onComplete={bulkComplete}
          onDelete={bulkDelete}
          onCancel={exitSelectionMode}
        />
      )}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default App;