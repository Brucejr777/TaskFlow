import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  today: Date;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggle: (taskId: string) => void;
  onToggleSelection: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onTogglePin: (taskId: string) => void;
}

export function TaskList({
  tasks,
  today,
  selectionMode,
  selectedIds,
  onToggle,
  onToggleSelection,
  onEdit,
  onDelete,
  onTogglePin,
}: TaskListProps) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          today={today}
          selectionMode={selectionMode}
          selected={selectedIds.has(task.id)}
          onToggle={onToggle}
          onToggleSelection={onToggleSelection}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}