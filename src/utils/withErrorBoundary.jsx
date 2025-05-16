import React from 'react';
import { errorTracker } from './monitoring';

/**
 * Error boundary component to catch errors in React component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our error tracking system
    errorTracker.captureError(error, {
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName || 'Unknown',
    });
  }

  render() {
    if (this.state.hasError) {
      // You can customize the fallback UI
      return this.props.fallback ? (
        this.props.fallback(this.state.error)
      ) : (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {object} options - Configuration options
 * @returns {React.Component} Wrapped component with error boundary
 */
export function withErrorBoundary(Component, options = {}) {
  const ComponentName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props) => (
    <ErrorBoundary 
      componentName={ComponentName}
      fallback={options.fallback}
    >
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${ComponentName})`;
  
  return WrappedComponent;
}

export default ErrorBoundary; 