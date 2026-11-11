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
exports.disconnectDatabase = exports.connectMemoryDatabase = exports.connectDatabase = exports.activeDatabaseMode = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let memoryServerInstance = null;
exports.activeDatabaseMode = 'EXTERNAL_PERSISTENT';
const connectDatabase = async () => {
    // Return cached active connection if available (critical for serverless / lambda lifecycle)
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    if (mongoose_1.default.connection.readyState === 2) {
        await new Promise((resolve) => mongoose_1.default.connection.once('open', resolve));
        return mongoose_1.default;
    }
    // 1. Automated Test Environment: Always use isolated in-memory MongoDB
    if (env_1.config.env === 'test') {
        exports.activeDatabaseMode = 'IN_MEMORY_TEST';
        logger_1.logger.info('[DATABASE] Mode: ISOLATED IN-MEMORY (Automated Testing)');
        return (0, exports.connectMemoryDatabase)();
    }
    // 2. Explicit Ephemeral Memory Mode (requested via MONGODB_URI=memory)
    if (env_1.config.db.uri === 'memory') {
        if (env_1.config.env === 'production') {
            const err = new Error('CRITICAL CONFIGURATION ERROR: In-memory database mode is strictly forbidden in production.');
            logger_1.logger.error(err.message);
            throw err;
        }
        exports.activeDatabaseMode = 'IN_MEMORY_EPHEMERAL';
        logger_1.logger.warn('[DATABASE] Mode: IN-MEMORY EPHEMERAL (Data will NOT persist across restarts)');
        return (0, exports.connectMemoryDatabase)();
    }
    // 3. Production Environment: External persistent MongoDB is strictly required
    if (env_1.config.env === 'production') {
        if (!env_1.config.db.uri || env_1.config.db.uri.includes('localhost') || env_1.config.db.uri === 'memory') {
            logger_1.logger.warn('[SECURITY] Warning: Production MONGODB_URI points to localhost or fallback URI. Ensure cluster is configured.');
        }
        try {
            exports.activeDatabaseMode = 'PRODUCTION_EXTERNAL';
            const safeUri = env_1.config.db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
            logger_1.logger.info(`[DATABASE] Mode: PRODUCTION EXTERNAL CLUSTER -> Connecting to ${safeUri}`);
            mongoose_1.default.set('strictQuery', true);
            await mongoose_1.default.connect(env_1.config.db.uri, {
                serverSelectionTimeoutMS: 15000,
            });
            logger_1.logger.info('[DATABASE] Successfully connected to production MongoDB cluster.');
            return mongoose_1.default;
        }
        catch (err) {
            logger_1.logger.error(`[DATABASE] CRITICAL: Failed to connect to production MongoDB cluster: ${err.message}`);
            throw err; // Never silently fall back in production
        }
    }
    // 4. Development Environment: Try external persistent URI first
    const isCloudCluster = env_1.config.db.uri.includes('mongodb+srv://') || (!env_1.config.db.uri.includes('localhost') && !env_1.config.db.uri.includes('127.0.0.1'));
    try {
        const safeUri = env_1.config.db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        logger_1.logger.info(`[DATABASE] Checking local/external MongoDB at: ${safeUri}...`);
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(env_1.config.db.uri, {
            serverSelectionTimeoutMS: isCloudCluster ? 15000 : 2500,
        });
        exports.activeDatabaseMode = 'EXTERNAL_PERSISTENT';
        logger_1.logger.info(`[DATABASE] Mode: EXTERNAL PERSISTENT MONGODB connected at ${safeUri}`);
        return mongoose_1.default;
    }
    catch (externalErr) {
        if (isCloudCluster) {
            logger_1.logger.error(`[DATABASE] Failed to connect to configured cloud MongoDB cluster: ${externalErr.message}`);
            throw externalErr;
        }
        logger_1.logger.info(`[DATABASE] External MongoDB unavailable (${externalErr.message}).`);
        logger_1.logger.info('[DATABASE] Activating EMBEDDED PERSISTENT database to guarantee data preservation across restarts...');
        // Boot MongoMemoryServer with explicit persistent disk path
        exports.activeDatabaseMode = 'EMBEDDED_PERSISTENT';
        const persistentDbDir = path_1.default.resolve(process.cwd(), '.mongo-data');
        if (!fs_1.default.existsSync(persistentDbDir)) {
            fs_1.default.mkdirSync(persistentDbDir, { recursive: true });
        }
        try {
            const { MongoMemoryServer } = await Promise.resolve().then(() => __importStar(require('mongodb-memory-server')));
            if (!memoryServerInstance) {
                memoryServerInstance = await MongoMemoryServer.create({
                    instance: {
                        dbPath: persistentDbDir,
                        storageEngine: 'wiredTiger',
                    },
                });
            }
            const uri = memoryServerInstance.getUri();
            logger_1.logger.info(`[DATABASE] Mode: EMBEDDED PERSISTENT (Storage directory: ${persistentDbDir})`);
            logger_1.logger.info(`[DATABASE] Embedded server listening on: ${uri}`);
            logger_1.logger.info('[DATABASE] Persistent data guarantees: All records and changes will persist across server restarts.');
            await mongoose_1.default.connect(uri);
            return mongoose_1.default;
        }
        catch (embeddedErr) {
            logger_1.logger.error('[DATABASE] Failed to initialize embedded persistent database:', embeddedErr);
            throw embeddedErr;
        }
    }
};
exports.connectDatabase = connectDatabase;
const connectMemoryDatabase = async () => {
    try {
        const { MongoMemoryServer } = await Promise.resolve().then(() => __importStar(require('mongodb-memory-server')));
        if (!memoryServerInstance) {
            memoryServerInstance = await MongoMemoryServer.create();
        }
        const uri = memoryServerInstance.getUri();
        await mongoose_1.default.connect(uri);
        return mongoose_1.default;
    }
    catch (err) {
        logger_1.logger.error('[DATABASE] Failed to initialize in-memory test runner:', err);
        throw err;
    }
};
exports.connectMemoryDatabase = connectMemoryDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        if (memoryServerInstance) {
            await memoryServerInstance.stop();
            memoryServerInstance = null;
        }
        logger_1.logger.info('[DATABASE] Database disconnected cleanly');
    }
    catch (err) {
        logger_1.logger.error('[DATABASE] Error during database disconnection:', err);
    }
};
exports.disconnectDatabase = disconnectDatabase;
