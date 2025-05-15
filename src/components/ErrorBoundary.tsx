import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can log errorInfo to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      return (
        <div style={{ color: 'red', padding: 20 }}>
          <h1>Something went wrong.</h1>
          <pre>{error?.toString()}</pre>
          {error?.message && <pre>Message: {error.message}</pre>}
          {error?.stack && <details><summary>Stack Trace</summary><pre>{error.stack}</pre></details>}
        </div>
      );
    }
    return this.props.children;
  }
}
