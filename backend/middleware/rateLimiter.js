const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');

/**
 * Rate limiter for authentication endpoints (login, register)
 * Stricter limits to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    retryAfter: Math.ceil(RATE_LIMIT.AUTH_WINDOW_MS / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default key generator (IP-based) - handles IPv6 properly
  // Note: We removed custom keyGenerator to fix IPv6 validation error
});

/**
 * General rate limiter for all API endpoints
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.GENERAL_WINDOW_MS,
  max: RATE_LIMIT.GENERAL_MAX_REQUESTS,
  message: {
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for sensitive operations
 * (e.g., marking attendance, updating records)
 */
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    message: 'Too many requests for this operation. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  generalLimiter,
  sensitiveLimiter,
};

