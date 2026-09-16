import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { ProgressFooter } from './components/ProgressFooter';
import { StatsGrid } from './components/StatsGrid';
import { TaskControls } from './components/TaskControls';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';
import { STORAGE_KEY } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { useToday } from './hooks/useToday';
import type { Priority, SortOption, StatusFilter, Task, TaskFormValues } from './types';
import { createId, filterAndSortTasks, getTaskStats, isTaskArray } from './utils/tasks';

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEY, [], isTaskArray);
  const [theme, setTheme] = useTheme();
  const today = useToday();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const stats = useMemo(() => getTaskStats(tasks, today), [tasks, today]);

  const filteredTasks = useMemo(
    () =>
      filterAndSortTasks(tasks, {
        search,
        statusFilter,
        priorityFilter,
        sortOption,
        today,
      }),
    [tasks, search, statusFilter, priorityFilter, sortOption, today],
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
      } else {
        const newTask: Task = {
          id: createId(),
          ...values,
          completed: false,
          createdAt: Date.now(),
        };
        setTasks((currentTasks) => [newTask, ...currentTasks]);
      }

      closeModal();
    },
    [closeModal, setTasks],
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
      if (window.confirm('Delete this task? This cannot be undone.')) {
        setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      }
    },
    [setTasks],
  );

  const clearCompleted = useCallback(() => {
    if (window.confirm('Clear all completed tasks?')) {
      setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));
    }
  }, [setTasks]);

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
              Capture the work ahead, keep deadlines in sight, and turn busy days into
              clear next steps.
            </p>
          </div>
          <button className="primary-button hero-action" type="button" onClick={openNewTask}>
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
            <button className="secondary-button" type="button" onClick={openNewTask}>
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
    </div>
  );
}

export default App;