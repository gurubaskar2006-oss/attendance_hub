"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
// Route imports
const authRoutes_1 = __importDefault(require("./modules/auth/authRoutes"));
const platformRoutes_1 = __importDefault(require("./modules/platform/platformRoutes"));
const academicRoutes_1 = __importDefault(require("./modules/academic/academicRoutes"));
const studentRoutes_1 = __importDefault(require("./modules/students/studentRoutes"));
const staffRoutes_1 = __importDefault(require("./modules/staff/staffRoutes"));
const parentRoutes_1 = __importDefault(require("./modules/parents/parentRoutes"));
const attendanceRoutes_1 = __importDefault(require("./modules/attendance/attendanceRoutes"));
const examinationRoutes_1 = __importDefault(require("./modules/examinations/examinationRoutes"));
const leaveRoutes_1 = __importDefault(require("./modules/leave/leaveRoutes"));
const announcementRoutes_1 = __importDefault(require("./modules/announcements/announcementRoutes"));
const notificationRoutes_1 = __importDefault(require("./modules/notifications/notificationRoutes"));
const reportRoutes_1 = __importDefault(require("./modules/reports/reportRoutes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // allow local dev and embedding
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin like mobile apps, curl, or Postman
        if (!origin)
            return callback(null, true);
        if (env_1.config.cors.allowedOrigins.indexOf(origin) !== -1 ||
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
        }
        else {
            callback(null, true); // Dev permissive
        }
    },
    credentials: true,
}));
// Rate limiter
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Parsers & logging
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)(env_1.config.jwt.cookieSecret));
if (env_1.config.env !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check endpoints
const handleHealth = (req, res) => {
    res.status(200).json({
        status: 'UP',
        platform: 'School Operations Platform',
        organization: '6th Civilians Corporation',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        version: '1.0.0',
        environment: env_1.config.env,
        databaseMode: database_1.activeDatabaseMode,
    });
};
app.get('/health', handleHealth);
app.get('/api/health', handleHealth);
app.get(`${env_1.config.apiPrefix}/health`, handleHealth);
// Ensure database is initialized before serving requests (critical for serverless environments)
app.use(async (req, res, next) => {
    if (req.path === '/health' || req.path === '/')
        return next();
    try {
        await (0, database_1.connectDatabase)();
        next();
    }
    catch (err) {
        logger_1.logger.error('Database connection error in request pipeline:', err.message);
        res.status(503).json({
            success: false,
            message: 'Database service unavailable. Please check cluster connection.',
        });
    }
});
// API Routes
const apiPrefix = env_1.config.apiPrefix;
const registerRoutes = (prefix) => {
    app.use(`${prefix}/auth`, authRoutes_1.default);
    app.use(`${prefix}/platform`, platformRoutes_1.default);
    app.use(`${prefix}/academic`, academicRoutes_1.default);
    app.use(`${prefix}/students`, studentRoutes_1.default);
    app.use(`${prefix}/staff`, staffRoutes_1.default);
    app.use(`${prefix}/parents`, parentRoutes_1.default);
    app.use(`${prefix}/attendance`, attendanceRoutes_1.default);
    app.use(`${prefix}/examinations`, examinationRoutes_1.default);
    app.use(`${prefix}/leave`, leaveRoutes_1.default);
    app.use(`${prefix}/announcements`, announcementRoutes_1.default);
    app.use(`${prefix}/notifications`, notificationRoutes_1.default);
    app.use(`${prefix}/reports`, reportRoutes_1.default);
};
registerRoutes(env_1.config.apiPrefix); // '/api/v1'
if (env_1.config.apiPrefix !== '/v1') {
    registerRoutes('/v1');
}
// 404 handler for undefined API routes
app.use(`${apiPrefix}/*`, (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    });
});
// Centralized Error Handling Middleware
app.use(errorHandler_1.errorHandler);
// Server startup function
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        // Seeding is an explicit command (npm run seed).
        // In development only, if SEED_ON_START=true is set and DB is empty, run seed.
        if (env_1.config.env === 'development' && process.env.SEED_ON_START === 'true') {
            try {
                const { User } = await Promise.resolve().then(() => __importStar(require('./models/User')));
                const userCount = await User.countDocuments();
                if (userCount === 0) {
                    logger_1.logger.info('[SEED] SEED_ON_START=true and database is empty. Running development seeder...');
                    const { runSeed } = await Promise.resolve().then(() => __importStar(require('./scripts/seed')));
                    await runSeed();
                }
            }
            catch (seedErr) {
                logger_1.logger.warn('[SEED] Seed notice:', seedErr.message);
            }
        }
        const server = app.listen(env_1.config.port, () => {
            logger_1.logger.info(`============================================================\n` +
                `  6th Civilians Corporation - School Operations Platform\n` +
                `  Server running on port: ${env_1.config.port}\n` +
                `  Health Check: http://localhost:${env_1.config.port}/health\n` +
                `  API Base URL: http://localhost:${env_1.config.port}${apiPrefix}\n` +
                `  Environment: ${env_1.config.env}\n` +
                `============================================================`);
        });
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Initiating graceful shutdown...`);
            server.close(async () => {
                await (0, database_1.disconnectDatabase)();
                logger_1.logger.info('Server closed gracefully.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return server;
    }
    catch (err) {
        logger_1.logger.error('Failed to start server:', err);
        process.exit(1);
    }
};
exports.startServer = startServer;
// Start automatically when invoked directly
if (require.main === module) {
    (0, exports.startServer)();
}
module.exports = app;
exports.default = app;
