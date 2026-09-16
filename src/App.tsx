import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CalendarRange,
  Download,
  Keyboard,
  ListChecks,
  Moon,
  Plus,
  Sun,
  Trash2,
} from 'lucide-react';
import { CalendarView } from './components/CalendarView';
import {
  CommandPalette,
  type PaletteCommand,
} from './components/CommandPalette';
import { EmptyState } from './components/EmptyState';
import { FocusOverlay } from './components/FocusOverlay';
import { Header } from './components/Header';
import { ProgressFooter } from './components/ProgressFooter';
import { QuickAdd } from './components/QuickAdd';
import { SelectionBar } from './components/SelectionBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { StatsGrid } from './components/StatsGrid';
import { TaskControls } from './components/TaskControls';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';
import { ToastViewport } from './components/Toast';
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  NOTIFICATIONS_KEY,
  STORAGE_KEY,
  VIEW_MODE_KEY,
} from './constants';
import { useFocusSession } from './hooks/useFocusSession';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import { useToasts } from './hooks/useToasts';
import { useToday } from './hooks/useToday';
import type {
  Priority,
  SortOption,
  StatusFilter,
  Task,
  TaskFormValues,
  ViewMode,
} from './types';
import { getNextDueDate, toDateInputValue } from './utils/date';
import { downloadTasks, extractTasksFromImport } from './utils/export';
import { filterAndSortTasks } from './utils/filters';
import { createId } from './utils/id';
import { getTaskStats } from './utils/stats';
import { duplicateTask } from './utils/tasks';
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
        archived: false,
        createdAt: Date.now(),
        updatedAt: undefined,
        dueDate: getNextDueDate(task.dueDate, task.recurrence),
        subtasks: task.subtasks.map((subtask) => ({ ...subtask, done: false })),
        focusSessions: 0,
        focusMinutes: 0,
      });
    }

    return { ...task, completed: true, updatedAt: Date.now() };
  });

  return [...spawned, ...updated];
};

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEY, [], parseTasks);
  const [theme, setTheme] = useTheme();
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    VIEW_MODE_KEY,
    'list',
  );
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>(
    NOTIFICATIONS_KEY,
    false,
  );
  const today = useToday();
  const { toasts, push, dismiss } = useToasts();
  const focus = useFocusSession();

  useNotifications(tasks, notificationsEnabled, today);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
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

  const toggleNotifications = useCallback(() => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);

    if (!next) {
      push('Reminders disabled', { kind: 'info' });
      return;
    }

    if (typeof Notification === 'undefined') {
      push('Your browser does not support notifications', { kind: 'warning' });
      return;
    }

    if (Notification.permission === 'denied') {
      push('Notifications are blocked in your browser settings', {
        kind: 'warning',
      });
      return;
    }

    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    push('Reminders enabled — you will be notified on due dates', {
      kind: 'success',
    });
  }, [notificationsEnabled, push, setNotificationsEnabled]);

  const handleQuickAdd = useCallback(
    (title: string) => {
      const newTask: Task = {
        id: createId(),
        title,
        description: '',
        priority: 'medium',
        dueDate: '',
        completed: false,
        archived: false,
        createdAt: Date.now(),
        tags: [],
        subtasks: [],
        recurrence: 'none',
        pinned: false,
        focusSessions: 0,
        focusMinutes: 0,
      };
      setTasks((current) => [newTask, ...current]);
      push('Task added', { kind: 'success' });
    },
    [push, setTasks],
  );

  const handleDuplicate = useCallback(
    (taskId: string) => {
      const target = tasks.find((task) => task.id === taskId);
      if (!target) {
        return;
      }
      const copy = duplicateTask(target);
      setTasks((current) => [copy, ...current]);
      push('Task duplicated', { kind: 'success' });
    },
    [push, setTasks, tasks],
  );

  const handleArchive = useCallback(
    (taskId: string) => {
      const target = tasks.find((task) => task.id === taskId);
      if (!target) {
        return;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? { ...task, archived: true, pinned: false, updatedAt: Date.now() }
            : task,
        ),
      );

      push('Task archived', {
        kind: 'info',
        actionLabel: 'Undo',
        onAction: () =>
          setTasks((current) =>
            current.map((task) =>
              task.id === taskId ? { ...task, archived: false } : task,
            ),
          ),
      });
    },
    [push, setTasks, tasks],
  );

  const handleRestore = useCallback(
    (taskId: string) => {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? { ...task, archived: false, updatedAt: Date.now() }
            : task,
        ),
      );
      push('Task restored', { kind: 'success' });
    },
    [push, setTasks],
  );

  const startFocus = useCallback(
    (task: Task) => {
      focus.start(task.id, task.title, DEFAULT_FOCUS_MINUTES);
    },
    [focus],
  );

  const completeFocusTask = useCallback(() => {
    const session = focus.session;
    if (!session) {
      return;
    }
    const { taskId, taskTitle, workDurationMs } = session;
    const minutes = Math.max(1, Math.round(workDurationMs / 60000));

    setTasks((current) => {
      const withFocus = current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              focusSessions: task.focusSessions + 1,
              focusMinutes: task.focusMinutes + minutes,
            }
          : task,
      );
      return applyCompletion(withFocus, new Set([taskId]));
    });

    push(`Completed "${taskTitle}" · +${minutes}m logged`, { kind: 'success' });
    focus.stop();
  }, [focus, push, setTasks]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (formOpen || shortcutsOpen || paletteOpen || focus.session) {
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
  }, [exitSelectionMode, focus.session, formOpen, paletteOpen, selectionMode, shortcutsOpen]);

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
          archived: false,
          createdAt: Date.now(),
          focusSessions: 0,
          focusMinutes: 0,
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
        if (!target || target.archived) {
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

  const bulkArchive = useCallback(() => {
    if (selectedIds.size === 0) {
      return;
    }
    const count = selectedIds.size;
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        selectedIds.has(task.id)
          ? { ...task, archived: true, pinned: false, updatedAt: Date.now() }
          : task,
      ),
    );
    push(`Archived ${count} ${count === 1 ? 'task' : 'tasks'}`, {
      kind: 'info',
      actionLabel: 'Undo',
      onAction: () =>
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            selectedIds.has(task.id) ? { ...task, archived: false } : task,
          ),
        ),
    });
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
    const removed = tasks.filter((task) => task.completed && !task.archived);
    if (removed.length === 0) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => !(task.completed && !task.archived)),
    );

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

  const paletteCommands: PaletteCommand[] = useMemo(
    () => [
      {
        id: 'new-task',
        label: 'Create a new task',
        hint: 'N',
        keywords: 'add create',
        icon: Plus,
        perform: openNewTask,
      },
      {
        id: 'toggle-theme',
        label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
        keywords: 'theme appearance dark light',
        icon: theme === 'dark' ? Sun : Moon,
        perform: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'toggle-view',
        label: `Show ${viewMode === 'list' ? 'calendar' : 'list'} view`,
        keywords: 'view calendar list',
        icon: CalendarRange,
        perform: () => setViewMode(viewMode === 'list' ? 'calendar' : 'list'),
      },
      {
        id: 'show-archived',
        label: 'Show archived tasks',
        keywords: 'archive history restore',
        icon: Trash2,
        perform: () => setStatusFilter('archived'),
      },
      {
        id: 'export',
        label: 'Export tasks as JSON',
        icon: Download,
        perform: handleExport,
      },
      {
        id: 'shortcuts',
        label: 'Show keyboard shortcuts',
        hint: '?',
        icon: Keyboard,
        perform: () => setShortcutsOpen(true),
      },
      {
        id: 'clear-completed',
        label: 'Clear completed tasks',
        keywords: 'remove done',
        icon: Trash2,
        perform: clearCompleted,
      },
    ],
    [clearCompleted, handleExport, openNewTask, setTheme, setViewMode, theme, viewMode],
  );

  return (
    <div
      className={`app-shell ${selectionMode ? 'has-selection-bar' : ''} ${
        focus.session ? 'has-focus-session' : ''
      }`}
    >
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onExport={handleExport}
        onImport={handleImport}
        onShowShortcuts={() => setShortcutsOpen(true)}
        onOpenPalette={() => setPaletteOpen(true)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={toggleNotifications}
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
              <div
                className="view-toggle"
                role="group"
                aria-label="Switch view"
              >
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                >
                  List
                </button>
                <button
                  type="button"
                  className={viewMode === 'calendar' ? 'is-active' : ''}
                  onClick={() => setViewMode('calendar')}
                  aria-pressed={viewMode === 'calendar'}
                >
                  Calendar
                </button>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={enterSelectionMode}
                disabled={
                  filteredTasks.length === 0 ||
                  selectionMode ||
                  statusFilter === 'archived'
                }
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

          {statusFilter !== 'archived' && <QuickAdd onAdd={handleQuickAdd} />}

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
            viewMode === 'calendar' && statusFilter !== 'archived' ? (
              <CalendarView
                tasks={filteredTasks}
                today={today}
                onSelectTask={openEditTask}
              />
            ) : (
              <TaskList
                tasks={filteredTasks}
                today={today}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggle={toggleTask}
                onToggleSelection={toggleSelection}
                onEdit={openEditTask}
                onDelete={deleteTask}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onTogglePin={togglePin}
                onStartFocus={startFocus}
              />
            )
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

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
        tasks={tasks}
        onSelectTask={openEditTask}
      />

      {focus.session && (
        <FocusOverlay
          session={focus.session}
          isComplete={focus.isComplete}
          onToggle={focus.toggle}
          onStop={focus.stop}
          onCompleteTask={completeFocusTask}
          onStartBreak={() => focus.startBreak(DEFAULT_BREAK_MINUTES)}
          onExtend={() => focus.extend(5)}
        />
      )}

      {selectionMode && (
        <SelectionBar
          count={selectedIds.size}
          total={filteredTasks.length}
          onSelectAll={selectAllVisible}
          onClearSelection={clearSelection}
          onComplete={bulkComplete}
          onArchive={bulkArchive}
          onDelete={bulkDelete}
          onCancel={exitSelectionMode}
        />
      )}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default App;