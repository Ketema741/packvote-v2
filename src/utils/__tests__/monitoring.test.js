import * as Sentry from '@sentry/react';
import { setupMonitoring, captureError, addBreadcrumb, setUserContext } from '../monitoring';

// Mock Sentry methods
jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  withProfiler: jest.fn(component => component)
}));

describe('Monitoring utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('initializes Sentry with correct configuration', () => {
    // Set environment variables for testing
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      REACT_APP_SENTRY_DSN: 'https://test-dsn@sentry.io/123456',
      REACT_APP_ENVIRONMENT: 'test',
      REACT_APP_VERSION: '1.0.0'
    };

    // Call the setup function
    setupMonitoring();

    // Check if Sentry.init was called with the correct config
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test-dsn@sentry.io/123456',
        environment: 'test',
        release: '1.0.0'
      })
    );

    // Restore environment variables
    process.env = originalEnv;
  });

  it('handles missing environment variables gracefully', () => {
    // Save original env vars
    const originalEnv = process.env;

    // Remove the environment variables
    process.env = {
      ...originalEnv,
      REACT_APP_SENTRY_DSN: undefined,
      REACT_APP_ENVIRONMENT: undefined,
      REACT_APP_VERSION: undefined
    };

    // Call the setup function
    setupMonitoring();

    // Check if Sentry.init was called with defaults
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      environment: 'development',
      release: expect.any(String)
    }));

    // Restore environment variables
    process.env = originalEnv;
  });

  it('captures errors correctly', () => {
    const testError = new Error('Test error');
    const context = { component: 'TestComponent', action: 'submit' };

    captureError(testError, context);

    expect(Sentry.captureException).toHaveBeenCalledWith(testError, {
      tags: context
    });
  });

  it('adds breadcrumbs with the correct data', () => {
    const breadcrumb = {
      category: 'ui.interaction',
      message: 'User clicked submit',
      level: 'info',
      data: { buttonId: 'submit-button' }
    };

    addBreadcrumb(breadcrumb);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
  });

  it('sets user context correctly', () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser'
    };

    setUserContext(user);

    expect(Sentry.setUser).toHaveBeenCalledWith(user);
  });

  it('clears user context when no user is provided', () => {
    setUserContext(null);

    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });
});