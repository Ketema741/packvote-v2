/**
 * Monitoring utilities for the PackVote UI
 *
 * This module provides functions for monitoring and error tracking
 * in the frontend application.
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (typeof window !== 'undefined' && window.performance) {
    // Report initial page load metrics
    window.addEventListener('load', () => {
      // Get performance timing metrics
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domLoadTime = perfData.domComplete - perfData.domLoading;

      // Log performance data (would send to backend in production)
      console.log('Performance metrics:', {
        pageLoadTime,
        domLoadTime,
        // Additional metrics
        dnsLookupTime: perfData.domainLookupEnd - perfData.domainLookupStart,
        serverResponseTime: perfData.responseEnd - perfData.requestStart,
        resourceLoadTime: perfData.loadEventEnd - perfData.responseEnd,
        timestamp: new Date().toISOString()
      });
    });

    // Monitor client-side navigation performance
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            console.log('Navigation performance:', {
              pageLoadTime: entry.loadEventEnd - entry.startTime,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
              firstPaint: entry.responseEnd,
              url: entry.name,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
    }
  }
};

// Tracking metrics for Prometheus
const metrics = {
  pageLoads: 0,
  apiCalls: 0,
  totalErrors: 0,
  navigationCount: 0,
  lastUpdateTime: Date.now()
};

// Update metrics
export const trackMetric = (metricName, increment = 1) => {
  if (metrics[metricName] !== undefined) {
    metrics[metricName] += increment;
  }
  metrics.lastUpdateTime = Date.now();

  // Send to server for Prometheus scraping (disabled to prevent 405 errors in deployed environment)
  // TODO: Re-enable when metrics endpoint is properly configured in production
  if (false && process.env.NODE_ENV !== 'test') {
    try {
      fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metric: metricName, value: increment })
      }).catch(error => {
        console.error('Failed to update server metrics:', error);
      });
    } catch (e) {
      console.error('Error sending metrics to server:', e);
    }
  }
};

/**
 * Generate metrics in Prometheus format
 * @returns {string} - Metrics in Prometheus text format
 */
export const generatePrometheusMetrics = () => {
  const uptime = (Date.now() - metrics.lastUpdateTime) / 1000;
  const lines = [
    '# HELP packvote_ui_page_loads_total Total number of page loads',
    '# TYPE packvote_ui_page_loads_total counter',
    `packvote_ui_page_loads_total ${metrics.pageLoads}`,
    '# HELP packvote_ui_api_calls_total Total number of API calls',
    '# TYPE packvote_ui_api_calls_total counter',
    `packvote_ui_api_calls_total ${metrics.apiCalls}`,
    '# HELP packvote_ui_errors_total Total number of errors',
    '# TYPE packvote_ui_errors_total counter',
    `packvote_ui_errors_total ${metrics.totalErrors}`,
    '# HELP packvote_ui_navigation_total Total number of in-app navigations',
    '# TYPE packvote_ui_navigation_total counter',
    `packvote_ui_navigation_total ${metrics.navigationCount}`,
    '# HELP packvote_ui_uptime_seconds Uptime in seconds',
    '# TYPE packvote_ui_uptime_seconds gauge',
    `packvote_ui_uptime_seconds ${uptime}`
  ];

  return lines.join('\n');
};

// Custom error tracking
export const errorTracker = {
  // Track errors that occur in the application
  captureError: (error, context = {}) => {
    // In production, this would send to your error tracking service
    console.error('Application error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // Could send to backend API endpoint in production
    // fetch('/api/errors/log', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     message: error.message,
    //     stack: error.stack,
    //     context,
    //   }),
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // }).catch(console.error);
  },

  // Set up global error handlers
  setupGlobalHandlers: () => {
    if (typeof window !== 'undefined') {
      // Handle uncaught exceptions
      window.addEventListener('error', (event) => {
        errorTracker.captureError(event.error || new Error(event.message), {
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          type: 'uncaught'
        });
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

        errorTracker.captureError(error, {
          type: 'unhandledrejection'
        });
      });
    }
  }
};

// User experience monitoring
export const userExperienceMonitor = {
  // Track user interactions
  trackInteraction: (actionType, details = {}) => {
    if (actionType === 'navigation') {
      trackMetric('navigationCount');
    }

    // In production, would send this to analytics or monitoring service
    console.log('User interaction:', {
      actionType,
      ...details,
      timestamp: new Date().toISOString()
    });
  },

  // Track API calls
  trackApiCall: (endpoint, startTime, status, error = null) => {
    const duration = Date.now() - startTime;
    trackMetric('apiCalls');

    if (error || status >= 400) {
      trackMetric('totalErrors');
    }

    // In production, would send this to monitoring service
    console.log('API call tracked:', {
      endpoint,
      duration,
      status,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }
};

// Network monitoring
export const networkMonitor = {
  // Wrap fetch calls to monitor performance
  monitorFetch: (url, options = {}) => {
    const startTime = Date.now();

    return fetch(url, options)
      .then(response => {
        userExperienceMonitor.trackApiCall(
          url,
          startTime,
          response.status
        );
        return response;
      })
      .catch(error => {
        userExperienceMonitor.trackApiCall(
          url,
          startTime,
          'error',
          error
        );
        throw error;
      });
  }
};

// Initialize all monitoring
export const initMonitoring = () => {
  // Initialize performance monitoring
  initPerformanceMonitoring();

  // Set up global error handlers
  errorTracker.setupGlobalHandlers();

  // Track initial page load
  trackMetric('pageLoads');

  // Log initialization
  console.log('Monitoring initialized', {
    environment: process.env.NODE_ENV,
    version: process.env.REACT_APP_VERSION || '0.1.0',
    timestamp: new Date().toISOString()
  });
};

/**
 * Initialize Sentry for application monitoring
 */
export const setupMonitoring = () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not provided. Monitoring will be limited to console logs.');
  }

  Sentry.init({
    dsn: dsn,
    integrations: [new BrowserTracing()],
    environment: process.env.REACT_APP_ENVIRONMENT || 'development',
    release: process.env.REACT_APP_VERSION || '0.1.0',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production
    tracesSampleRate: 0.5,

    // Only enable in production to reduce noise during development
    enabled: process.env.NODE_ENV === 'production' || !!dsn,

    // Capture errors from failed API requests
    beforeSend(event) {
      if (event.exception) {
        console.error('[Sentry] Error captured:', event.exception);
      }
      return event;
    }
  });

  // Log initialization
  console.log(`[Monitoring] Initialized for ${process.env.REACT_APP_ENVIRONMENT || 'development'} environment`);
};

/**
 * Capture an error with additional context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context for the error
 */
export const captureError = (error, context = {}) => {
  console.error('[Error]', error, context);

  Sentry.captureException(error, {
    tags: context
  });
};

/**
 * Add a breadcrumb to track user actions
 * @param {Object} breadcrumb - Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set user context for error tracking
 * @param {Object|null} user - User data or null to clear
 */
export const setUserContext = (user) => {
  Sentry.setUser(user);
};

/**
 * Performance monitoring for components
 * @param {React.Component} Component - The component to monitor
 * @param {string} name - Component name for the profiler
 */
export const withPerformanceMonitoring = (Component, name) => {
  return Sentry.withProfiler(Component, { name });
};

/**
 * Track API requests for performance monitoring
 * @param {string} url - API URL
 * @param {string} method - HTTP method
 * @param {number} startTime - Request start timestamp
 * @param {number} status - HTTP status code
 */
export const trackApiRequest = (url, method, startTime, status) => {
  const duration = Date.now() - startTime;

  // Log API request timing
  console.debug(`[API] ${method} ${url} - ${status} (${duration}ms)`);

  // Add breadcrumb for API call
  addBreadcrumb({
    category: 'api',
    message: `${method} ${url}`,
    data: {
      url,
      method,
      status,
      duration
    },
    level: status >= 400 ? 'error' : 'info'
  });

  // Track as performance metric
  if (window.performance && window.performance.mark) {
    window.performance.mark(`api-${method}-${url}-end`);
    try {
      window.performance.measure(
        `api-${method}-${url}`,
        `api-${method}-${url}-start`,
        `api-${method}-${url}-end`
      );
    } catch (e) {
      // Measurement may fail if the start mark wasn't created
      console.warn('Performance measurement failed:', e);
    }
  }
};

/**
 * Start tracking an API request
 * @param {string} url - API URL
 * @param {string} method - HTTP method
 * @returns {number} Start timestamp
 */
export const startApiRequest = (url, method) => {
  const startTime = Date.now();

  // Mark the start of the request
  if (window.performance && window.performance.mark) {
    window.performance.mark(`api-${method}-${url}-start`);
  }

  return startTime;
};

// Initialize monitoring on script load if enabled
if (process.env.NODE_ENV === 'production') {
  setupMonitoring();
}