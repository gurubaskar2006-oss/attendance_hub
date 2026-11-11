import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { config } from './env';
import { logger } from '../utils/logger';

let memoryServerInstance: any = null;

export type DatabaseMode =
  | 'PRODUCTION_EXTERNAL'
  | 'EXTERNAL_PERSISTENT'
  | 'EMBEDDED_PERSISTENT'
  | 'IN_MEMORY_TEST'
  | 'IN_MEMORY_EPHEMERAL';

export let activeDatabaseMode: DatabaseMode = 'EXTERNAL_PERSISTENT';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  // Return cached active connection if available (critical for serverless / lambda lifecycle)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
    return mongoose;
  }

  // 1. Automated Test Environment: Always use isolated in-memory MongoDB
  if (config.env === 'test') {
    activeDatabaseMode = 'IN_MEMORY_TEST';
    logger.info('[DATABASE] Mode: ISOLATED IN-MEMORY (Automated Testing)');
    return connectMemoryDatabase();
  }

  // 2. Explicit Ephemeral Memory Mode (requested via MONGODB_URI=memory)
  if (config.db.uri === 'memory') {
    if (config.env === 'production') {
      const err = new Error('CRITICAL CONFIGURATION ERROR: In-memory database mode is strictly forbidden in production.');
      logger.error(err.message);
      throw err;
    }
    activeDatabaseMode = 'IN_MEMORY_EPHEMERAL';
    logger.warn('[DATABASE] Mode: IN-MEMORY EPHEMERAL (Data will NOT persist across restarts)');
    return connectMemoryDatabase();
  }

  // 3. Production Environment: External persistent MongoDB is strictly required
  if (config.env === 'production') {
    if (!config.db.uri || config.db.uri.includes('localhost') || config.db.uri === 'memory') {
      logger.warn('[SECURITY] Warning: Production MONGODB_URI points to localhost or fallback URI. Ensure cluster is configured.');
    }
    try {
      activeDatabaseMode = 'PRODUCTION_EXTERNAL';
      const safeUri = config.db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
      logger.info(`[DATABASE] Mode: PRODUCTION EXTERNAL CLUSTER -> Connecting to ${safeUri}`);
      mongoose.set('strictQuery', true);
      await mongoose.connect(config.db.uri, {
        serverSelectionTimeoutMS: 15000,
      });
      logger.info('[DATABASE] Successfully connected to production MongoDB cluster.');
      return mongoose;
    } catch (err: any) {
      logger.error(`[DATABASE] CRITICAL: Failed to connect to production MongoDB cluster: ${err.message}`);
      throw err; // Never silently fall back in production
    }
  }

  // 4. Development Environment: Try external persistent URI first
  const isCloudCluster = config.db.uri.includes('mongodb+srv://') || (!config.db.uri.includes('localhost') && !config.db.uri.includes('127.0.0.1'));
  try {
    const safeUri = config.db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    logger.info(`[DATABASE] Checking local/external MongoDB at: ${safeUri}...`);
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.db.uri, {
      serverSelectionTimeoutMS: isCloudCluster ? 15000 : 2500,
    });
    activeDatabaseMode = 'EXTERNAL_PERSISTENT';
    logger.info(`[DATABASE] Mode: EXTERNAL PERSISTENT MONGODB connected at ${safeUri}`);
    return mongoose;
  } catch (externalErr: any) {
    if (isCloudCluster) {
      logger.error(`[DATABASE] Failed to connect to configured cloud MongoDB cluster: ${externalErr.message}`);
      throw externalErr;
    }
    logger.info(`[DATABASE] External MongoDB unavailable (${externalErr.message}).`);
    logger.info('[DATABASE] Activating EMBEDDED PERSISTENT database to guarantee data preservation across restarts...');

    // Boot MongoMemoryServer with explicit persistent disk path
    activeDatabaseMode = 'EMBEDDED_PERSISTENT';
    const persistentDbDir = path.resolve(process.cwd(), '.mongo-data');
    if (!fs.existsSync(persistentDbDir)) {
      fs.mkdirSync(persistentDbDir, { recursive: true });
    }

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      if (!memoryServerInstance) {
        memoryServerInstance = await MongoMemoryServer.create({
          instance: {
            dbPath: persistentDbDir,
            storageEngine: 'wiredTiger',
          },
        });
      }
      const uri = memoryServerInstance.getUri();
      logger.info(`[DATABASE] Mode: EMBEDDED PERSISTENT (Storage directory: ${persistentDbDir})`);
      logger.info(`[DATABASE] Embedded server listening on: ${uri}`);
      logger.info('[DATABASE] Persistent data guarantees: All records and changes will persist across server restarts.');
      await mongoose.connect(uri);
      return mongoose;
    } catch (embeddedErr: any) {
      logger.error('[DATABASE] Failed to initialize embedded persistent database:', embeddedErr);
      throw embeddedErr;
    }
  }
};

export const connectMemoryDatabase = async (): Promise<typeof mongoose> => {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    if (!memoryServerInstance) {
      memoryServerInstance = await MongoMemoryServer.create();
    }
    const uri = memoryServerInstance.getUri();
    await mongoose.connect(uri);
    return mongoose;
  } catch (err: any) {
    logger.error('[DATABASE] Failed to initialize in-memory test runner:', err);
    throw err;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    logger.info('[DATABASE] Database disconnected cleanly');
  } catch (err: any) {
    logger.error('[DATABASE] Error during database disconnection:', err);
  }
};
