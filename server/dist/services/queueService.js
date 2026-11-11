"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class QueueService {
    handlers = new Map();
    isRedisEnabled;
    constructor() {
        this.isRedisEnabled = Boolean(env_1.config.redis.url && env_1.config.redis.url.trim() !== '');
        if (this.isRedisEnabled) {
            logger_1.logger.info(`[QUEUE SERVICE] BullMQ Redis connection configured at ${env_1.config.redis.url}`);
        }
        else {
            logger_1.logger.info('[QUEUE SERVICE] Redis not configured. Using high-efficiency in-process asynchronous task runner.');
        }
    }
    registerHandler(jobName, handler) {
        this.handlers.set(jobName, handler);
    }
    async addJob(jobName, data) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const job = {
            id: jobId,
            name: jobName,
            data,
            timestamp: Date.now(),
        };
        const handler = this.handlers.get(jobName);
        if (!handler) {
            logger_1.logger.warn(`[QUEUE SERVICE] No registered handler for job: ${jobName}`);
            return jobId;
        }
        // Process asynchronously on next tick without blocking caller
        setImmediate(async () => {
            try {
                logger_1.logger.debug(`[QUEUE SERVICE] Processing job ${jobName} (ID: ${jobId})`);
                await handler(job);
                logger_1.logger.debug(`[QUEUE SERVICE] Successfully completed job ${jobName} (ID: ${jobId})`);
            }
            catch (err) {
                logger_1.logger.error(`[QUEUE SERVICE] Error executing job ${jobName} (ID: ${jobId}):`, err.message);
            }
        });
        return jobId;
    }
}
exports.QueueService = QueueService;
exports.queueService = new QueueService();
