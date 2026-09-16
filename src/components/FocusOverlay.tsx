import { Check, Pause, Play, Square, X } from 'lucide-react';
import type { FocusSession } from '../hooks/useFocusSession';

interface FocusOverlayProps {
  session: FocusSession;
  isComplete: boolean;
  onToggle: () => void;
  onStop: () => void;
  onCompleteTask: () => void;
}

const formatTime = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function FocusOverlay({
  session,
  isComplete,
  onToggle,
  onStop,
  onCompleteTask,
}: FocusOverlayProps) {
  const progress =
    session.durationMs === 0
      ? 1
      : 1 - session.remainingMs / session.durationMs;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="modal-backdrop focus-backdrop" role="presentation">
      <div
        className="focus-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Focus session"
      >
        <button
          className="icon-button focus-close"
          type="button"
          onClick={onStop}
          aria-label="End focus session"
        >
          <X size={18} />
        </button>

        <p className="modal-kicker">
          {isComplete ? 'Session complete' : 'Focus session'}
        </p>
        <h2 className="focus-task-title">{session.taskTitle}</h2>

        <div className="focus-ring-wrap">
          <svg viewBox="0 0 200 200" className="focus-ring" aria-hidden="true">
            <circle
              className="focus-ring-track"
              cx="100"
              cy="100"
              r={RADIUS}
            />
            <circle
              className="focus-ring-fill"
              cx="100"
              cy="100"
              r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="focus-time" aria-live="polite">
            {formatTime(session.remainingMs)}
          </div>
        </div>

        <div className="focus-actions">
          {isComplete ? (
            <>
              <button className="secondary-button" type="button" onClick={onStop}>
                Close
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={onCompleteTask}
              >
                <Check size={17} />
                Complete task
              </button>
            </>
          ) : (
            <>
              <button className="secondary-button" type="button" onClick={onStop}>
                <Square size={15} />
                End
              </button>
              <button className="primary-button" type="button" onClick={onToggle}>
                {session.running ? <Pause size={17} /> : <Play size={17} />}
                {session.running ? 'Pause' : 'Resume'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}