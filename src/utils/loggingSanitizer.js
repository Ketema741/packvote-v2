/**
 * Utility for sanitizing sensitive information from console logs
 */

/**
 * Removes or obfuscates sensitive information from objects before logging
 * @param {Object} obj - Object to sanitize
 * @param {Array} sensitiveKeys - Optional list of additional keys to sanitize
 * @returns {Object} Sanitized object safe for logging
 */
export const sanitizeForLogging = (obj, sensitiveKeys = []) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Default sensitive keys to sanitize
  const defaultSensitiveKeys = [
    'password', 'api_key', 'apiKey', 'token', 'access_token',
    'refresh_token', 'auth_token', 'secret', 'credentials',
    'phone', 'email', 'user_id', 'userId'
  ];

  // Combine default and additional sensitive keys
  const allSensitiveKeys = [...defaultSensitiveKeys, ...sensitiveKeys];

  // If it's an array, sanitize each item
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, sensitiveKeys));
  }

  // Clone the object to avoid modifying the original
  const sanitized = { ...obj };

  // Sanitize sensitive fields
  for (const key in sanitized) {
    // Check if this is a sensitive key that should be redacted
    if (allSensitiveKeys.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    }
    // Recursively sanitize nested objects
    else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key], sensitiveKeys);
    }
  }

  return sanitized;
};

/**
 * Safe console logging with automatic sanitization
 */
export const safeLog = {
  info: (message, ...data) => {
    if (data.length > 0) {
      console.info(message, ...data.map(item => sanitizeForLogging(item)));
    } else {
      console.info(message);
    }
  },

  error: (message, ...data) => {
    if (data.length > 0) {
      console.error(message, ...data.map(item => sanitizeForLogging(item)));
    } else {
      console.error(message);
    }
  },

  warn: (message, ...data) => {
    if (data.length > 0) {
      console.warn(message, ...data.map(item => sanitizeForLogging(item)));
    } else {
      console.warn(message);
    }
  },

  debug: (message, ...data) => {
    if (process.env.NODE_ENV !== 'production') {
      if (data.length > 0) {
        console.debug(message, ...data.map(item => sanitizeForLogging(item)));
      } else {
        console.debug(message);
      }
    }
  }
};

/**
 * Helper to safely log API responses by removing sensitive data
 */
export const logApiResponse = (message, response) => {
  // If response is undefined or null, just log the message
  if (!response) {
    safeLog.info(message);
    return;
  }

  // Create a sanitized version of the response
  const sanitized = {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  };

  // Don't include response data by default as it may contain sensitive information
  safeLog.info(message, sanitized);
};

export default safeLog;