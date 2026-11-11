"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
/**
 * Strict login rate limiter to protect against brute-force attacks.
 * Allows a configurable number of failed attempts (default 5) per IP per 15-minute window.
 * Successful logins do not count towards the limit.
 */
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.loginWindowMs,
    max: env_1.config.rateLimit.loginMaxAttempts,
    skipSuccessfulRequests: true, // Only failed attempts are penalized
    message: {
        success: false,
        message: `Too many failed login attempts from this IP. Account access is temporarily locked. Please try again after 15 minutes.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
