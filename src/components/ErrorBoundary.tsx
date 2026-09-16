import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('TaskFlow crashed:', error, info);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div className="error-fallback" role="alert">
          <h1>Something went wrong</h1>
          <p>
            TaskFlow hit an unexpected error. Your saved tasks are still safe in
            local storage.
          </p>
          <p className="error-fallback-detail">{error.message}</p>
          <button
            className="primary-button"
            type="button"
            onClick={this.handleReset}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}