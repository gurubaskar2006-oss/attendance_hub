import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * Strict login rate limiter to protect against brute-force attacks.
 * Allows a configurable number of failed attempts (default 5) per IP per 15-minute window.
 * Successful logins do not count towards the limit.
 */
export const loginRateLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMaxAttempts,
  skipSuccessfulRequests: true, // Only failed attempts are penalized
  message: {
    success: false,
    message: `Too many failed login attempts from this IP. Account access is temporarily locked. Please try again after 15 minutes.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

