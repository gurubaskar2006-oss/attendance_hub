"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
    // Handle Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'record';
        res.status(409).json({
            success: false,
            message: `A duplicate record already exists with this ${field}.`,
            field,
        });
        return;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors || {}).map((e) => ({
            path: e.path,
            message: e.message,
        }));
        res.status(400).json({
            success: false,
            message: 'Database validation error.',
            errors,
        });
        return;
    }
    // Handle CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: `Invalid identifier format: ${err.value}`,
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'An unexpected internal server error occurred.'
        : err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
