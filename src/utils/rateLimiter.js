/**
 * Client-side rate limiting utility
 *
 * This module provides rate limiting functionality for API calls to complement
 * the server-side rate limiting and improve user experience by preventing
 * excessive requests that would be rejected by the server.
 */

import { safeLog } from './loggingSanitizer';

class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.requestCounts = new Map();

    // Default rate limits (requests per minute)
    this.defaultLimits = {
      '/api/trips': { limit: 8, window: 60000 }, // 8 requests per minute (buffer from server's 10)
      '/api/send-sms': { limit: 25, window: 60000 }, // 25 requests per minute (buffer from server's 30)
      '/api/send-all-sms': { limit: 8, window: 60000 }, // 8 requests per minute (buffer from server's 10)
      '/api/survey-response': { limit: 50, window: 60000 }, // 50 requests per minute (buffer from server's 60)
      '/api/recommendations/generate': { limit: 4, window: 60000 }, // 4 requests per minute (buffer from server's 5)
      '/api/recommendations/vote': { limit: 25, window: 60000 }, // 25 requests per minute (buffer from server's 30)
      'default': { limit: 20, window: 60000 } // Default limit for other endpoints
    };

    // Initialize limits
    Object.entries(this.defaultLimits).forEach(([endpoint, config]) => {
      this.limits.set(endpoint, config);
      this.requestCounts.set(endpoint, []);
    });

    // Clean up old requests every minute
    setInterval(() => this.cleanup(), 30000);
  }

  /**
   * Check if a request to the given endpoint is allowed
   * @param {string} endpoint - API endpoint path
   * @returns {Object} - { allowed: boolean, retryAfter?: number }
   */
  checkLimit(endpoint) {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const config = this.limits.get(normalizedEndpoint) || this.limits.get('default');
    const requests = this.requestCounts.get(normalizedEndpoint) || [];

    const now = Date.now();
    const windowStart = now - config.window;

    // Filter out requests outside the current window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length >= config.limit) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + config.window - now) / 1000);

      safeLog.warn(`Rate limit exceeded for ${normalizedEndpoint}. Retry after ${retryAfter} seconds.`);

      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        resetTime: oldestRequest + config.window
      };
    }

    return {
      allowed: true,
      remaining: config.limit - recentRequests.length - 1, // -1 for the current request
      resetTime: now + config.window
    };
  }

  /**
   * Record a request to the given endpoint
   * @param {string} endpoint - API endpoint path
   */
  recordRequest(endpoint) {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const requests = this.requestCounts.get(normalizedEndpoint) || [];

    requests.push(Date.now());
    this.requestCounts.set(normalizedEndpoint, requests);

    safeLog.debug(`Recorded request to ${normalizedEndpoint}. Total recent requests: ${requests.length}`);
  }

  /**
   * Normalize endpoint path for consistent tracking
   * @param {string} endpoint - Full URL or endpoint path
   * @returns {string} - Normalized endpoint path
   */
  normalizeEndpoint(endpoint) {
    // Extract path from full URL if needed
    try {
      const url = new URL(endpoint);
      endpoint = url.pathname;
    } catch (e) {
      // Not a full URL, assume it's already a path
    }

    // Normalize specific patterns
    if (endpoint.startsWith('/api/trips/') && endpoint !== '/api/trips') {
      return '/api/trips/:id'; // Group trip detail requests
    }

    if (endpoint.startsWith('/api/recommendations/votes/')) {
      return '/api/recommendations/votes/:id';
    }

    if (endpoint.startsWith('/api/recommendations/calculate-winner/')) {
      return '/api/recommendations/calculate-winner/:id';
    }

    if (endpoint.startsWith('/api/recommendations/winner/')) {
      return '/api/recommendations/winner/:id';
    }

    if (endpoint.startsWith('/api/recommendations/') && endpoint.endsWith('/generate')) {
      return '/api/recommendations/generate';
    }

    // Check if we have a specific limit for this endpoint
    if (this.limits.has(endpoint)) {
      return endpoint;
    }

    return 'default';
  }

  /**
   * Clean up old request records to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();

    this.requestCounts.forEach((requests, endpoint) => {
      const config = this.limits.get(endpoint) || this.limits.get('default');
      const windowStart = now - config.window;

      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      this.requestCounts.set(endpoint, recentRequests);
    });

    safeLog.debug('Rate limiter cleanup completed');
  }

  /**
   * Get current status for an endpoint
   * @param {string} endpoint - API endpoint path
   * @returns {Object} - Status information
   */
  getStatus(endpoint) {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const config = this.limits.get(normalizedEndpoint) || this.limits.get('default');
    const requests = this.requestCounts.get(normalizedEndpoint) || [];

    const now = Date.now();
    const windowStart = now - config.window;
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    return {
      endpoint: normalizedEndpoint,
      limit: config.limit,
      used: recentRequests.length,
      remaining: config.limit - recentRequests.length,
      resetTime: windowStart + config.window,
      windowDuration: config.window
    };
  }

  /**
   * Wait for rate limit to reset if needed
   * @param {string} endpoint - API endpoint path
   * @returns {Promise} - Resolves when request is allowed
   */
  async waitForLimit(endpoint) {
    const status = this.checkLimit(endpoint);

    if (status.allowed) {
      return Promise.resolve();
    }

    safeLog.info(`Waiting ${status.retryAfter} seconds for rate limit reset on ${endpoint}`);

    return new Promise(resolve => {
      setTimeout(resolve, status.retryAfter * 1000);
    });
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter();

/**
 * Enhanced fetch wrapper with rate limiting
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {boolean} respectRateLimit - Whether to respect rate limits (default: true)
 * @returns {Promise<Response>} - Fetch response
 */
export const rateLimitedFetch = async (url, options = {}, respectRateLimit = true) => {
  if (respectRateLimit) {
    const limitCheck = rateLimiter.checkLimit(url);

    if (!limitCheck.allowed) {
      const error = new Error(`Rate limit exceeded. Please wait ${limitCheck.retryAfter} seconds before retrying.`);
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.retryAfter = limitCheck.retryAfter;
      error.resetTime = limitCheck.resetTime;
      throw error;
    }

    // Record the request
    rateLimiter.recordRequest(url);
  }

  // Make the actual request
  return fetch(url, options);
};

/**
 * Get rate limiter status for debugging
 * @param {string} endpoint - Optional specific endpoint
 * @returns {Object} - Rate limiter status
 */
export const getRateLimiterStatus = (endpoint = null) => {
  if (endpoint) {
    return rateLimiter.getStatus(endpoint);
  }

  // Return status for all tracked endpoints
  const allStatuses = {};
  rateLimiter.limits.forEach((config, endpointPath) => {
    if (endpointPath !== 'default') {
      allStatuses[endpointPath] = rateLimiter.getStatus(endpointPath);
    }
  });

  return allStatuses;
};

/**
 * Check if a request to an endpoint would be allowed
 * @param {string} endpoint - API endpoint path
 * @returns {Object} - { allowed: boolean, retryAfter?: number, remaining?: number }
 */
export const checkRateLimit = (endpoint) => {
  return rateLimiter.checkLimit(endpoint);
};

/**
 * Wait for rate limit to reset if needed
 * @param {string} endpoint - API endpoint path
 * @returns {Promise} - Resolves when request is allowed
 */
export const waitForRateLimit = (endpoint) => {
  return rateLimiter.waitForLimit(endpoint);
};

export default rateLimiter;