import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Plus } from 'lucide-react';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { ProgressFooter } from './components/ProgressFooter';
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
import { filterAndSortTasks } from './utils/filters';
import { createId } from './utils/id';
import { getTaskStats } from './utils/stats';
import { isTaskArray } from './utils/validation';

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

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEY, [], isTaskArray);
  const [theme, setTheme] = useTheme();
  const today = useToday();
  const { toasts, push, dismiss } = useToasts();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const stats = useMemo(() => getTaskStats(tasks, today), [tasks, today]);

  const filteredTasks = useMemo(
    () =>
      filterAndSortTasks(tasks, {
        search: deferredSearch,
        statusFilter,
        priorityFilter,
        sortOption,
        today,
      }),
    [tasks, deferredSearch, statusFilter, priorityFilter, sortOption, today],
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

  // Press "n" anywhere outside a form field to create a new task.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (formOpen || event.defaultPrevented) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === 'n') {
        event.preventDefault();
        setEditingTask(null);
        setFormOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formOpen]);

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
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
      );
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
  }, []);

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
            <button
              className="secondary-button"
              type="button"
              onClick={openNewTask}
            >
              <Plus size={17} />
              New task
            </button>
          </div>

          <TaskControls
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
          />

          {filteredTasks.length > 0 ? (
            <TaskList
              tasks={filteredTasks}
              today={today}
              onToggle={toggleTask}
              onEdit={openEditTask}
              onDelete={deleteTask}
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

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default App;