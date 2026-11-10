import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config/env';
import { connectDatabase, disconnectDatabase, activeDatabaseMode } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/authRoutes';
import platformRoutes from './modules/platform/platformRoutes';
import academicRoutes from './modules/academic/academicRoutes';
import studentRoutes from './modules/students/studentRoutes';
import staffRoutes from './modules/staff/staffRoutes';
import parentRoutes from './modules/parents/parentRoutes';
import attendanceRoutes from './modules/attendance/attendanceRoutes';
import examinationRoutes from './modules/examinations/examinationRoutes';
import leaveRoutes from './modules/leave/leaveRoutes';
import announcementRoutes from './modules/announcements/announcementRoutes';
import notificationRoutes from './modules/notifications/notificationRoutes';
import reportRoutes from './modules/reports/reportRoutes';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // allow local dev and embedding
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin like mobile apps, curl, or Postman
      if (!origin) return callback(null, true);
      if (
        config.cors.allowedOrigins.indexOf(origin) !== -1 ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive
      }
    },
    credentials: true,
  })
);

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parsers & logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.jwt.cookieSecret));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    platform: 'School Operations Platform',
    organization: '6th Civilians Corporation',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: config.env,
    databaseMode: activeDatabaseMode,
  });
});

// Ensure database is initialized before serving requests (critical for serverless environments)
app.use(async (req, res, next) => {
  if (req.path === '/health' || req.path === '/') return next();
  try {
    await connectDatabase();
    next();
  } catch (err: any) {
    logger.error('Database connection error in request pipeline:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please check cluster connection.',
    });
  }
});

// API Routes
const apiPrefix = config.apiPrefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/platform`, platformRoutes);
app.use(`${apiPrefix}/academic`, academicRoutes);
app.use(`${apiPrefix}/students`, studentRoutes);
app.use(`${apiPrefix}/staff`, staffRoutes);
app.use(`${apiPrefix}/parents`, parentRoutes);
app.use(`${apiPrefix}/attendance`, attendanceRoutes);
app.use(`${apiPrefix}/examinations`, examinationRoutes);
app.use(`${apiPrefix}/leave`, leaveRoutes);
app.use(`${apiPrefix}/announcements`, announcementRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/reports`, reportRoutes);

// 404 handler for undefined API routes
app.use(`${apiPrefix}/*`, (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Server startup function
export const startServer = async () => {
  try {
    await connectDatabase();

    // Seeding is an explicit command (npm run seed).
    // In development only, if SEED_ON_START=true is set and DB is empty, run seed.
    if (config.env === 'development' && process.env.SEED_ON_START === 'true') {
      try {
        const { User } = await import('./models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          logger.info('[SEED] SEED_ON_START=true and database is empty. Running development seeder...');
          const { runSeed } = await import('./scripts/seed');
          await runSeed();
        }
      } catch (seedErr: any) {
        logger.warn('[SEED] Seed notice:', seedErr.message);
      }
    }

    const server = app.listen(config.port, () => {
      logger.info(
        `============================================================\n` +
        `  6th Civilians Corporation - School Operations Platform\n` +
        `  Server running on port: ${config.port}\n` +
        `  Health Check: http://localhost:${config.port}/health\n` +
        `  API Base URL: http://localhost:${config.port}${apiPrefix}\n` +
        `  Environment: ${config.env}\n` +
        `============================================================`
      );
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed gracefully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (err: any) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start automatically when invoked directly
if (require.main === module) {
  startServer();
}

export default app;
