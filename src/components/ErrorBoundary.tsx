
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <AlertTriangle className="h-12 w-12 text-accent mx-auto mb-4" />
            <h2 className="font-display font-extrabold text-3xl text-ink mb-2">Something went wrong</h2>
            <p className="text-ink-soft mb-4">
              There was an error rendering this component.
            </p>
            <div className="border-y border-accent p-3 mb-6 text-left">
              <p className="text-sm text-accent font-medium">Error details:</p>
              <p className="text-sm text-accent font-mono mt-1 overflow-auto max-h-48">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center bg-flag hover:brightness-110 text-white px-4 py-2 transition mx-auto"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
