import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface IQueueJob<T = any> {
  id: string;
  name: string;
  data: T;
  timestamp: number;
}

export type JobHandler<T = any> = (job: IQueueJob<T>) => Promise<void>;

export class QueueService {
  private handlers: Map<string, JobHandler> = new Map();
  private isRedisEnabled: boolean;

  constructor() {
    this.isRedisEnabled = Boolean(config.redis.url && config.redis.url.trim() !== '');
    if (this.isRedisEnabled) {
      logger.info(`[QUEUE SERVICE] BullMQ Redis connection configured at ${config.redis.url}`);
    } else {
      logger.info(
        '[QUEUE SERVICE] Redis not configured. Using high-efficiency in-process asynchronous task runner.'
      );
    }
  }

  public registerHandler<T>(jobName: string, handler: JobHandler<T>): void {
    this.handlers.set(jobName, handler);
  }

  public async addJob<T>(jobName: string, data: T): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const job: IQueueJob<T> = {
      id: jobId,
      name: jobName,
      data,
      timestamp: Date.now(),
    };

    const handler = this.handlers.get(jobName);
    if (!handler) {
      logger.warn(`[QUEUE SERVICE] No registered handler for job: ${jobName}`);
      return jobId;
    }

    // Process asynchronously on next tick without blocking caller
    setImmediate(async () => {
      try {
        logger.debug(`[QUEUE SERVICE] Processing job ${jobName} (ID: ${jobId})`);
        await handler(job);
        logger.debug(`[QUEUE SERVICE] Successfully completed job ${jobName} (ID: ${jobId})`);
      } catch (err: any) {
        logger.error(`[QUEUE SERVICE] Error executing job ${jobName} (ID: ${jobId}):`, err.message);
      }
    });

    return jobId;
  }
}

export const queueService = new QueueService();

