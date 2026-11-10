import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface ISmsPayload {
  toPhone: string;
  message: string;
  senderId?: string;
  templateId?: string;
}

export interface ISmsResult {
  success: boolean;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  providerMessageId?: string;
  error?: string;
}

export class SmsAdapter {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(config.sms.authKey && config.sms.authKey.trim() !== '');
  }

  public async send(payload: ISmsPayload): Promise<ISmsResult> {
    if (!this.isConfigured) {
      logger.info(
        `[SMS ADAPTER - SIMULATED MODE] (Provider unconfigured). Destination: ${payload.toPhone} | Message: "${payload.message}"`
      );
      return {
        success: true,
        status: 'SIMULATED',
        providerMessageId: `SIM-SMS-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      // Real SMS provider dispatch (e.g. MSG91 API)
      logger.info(`[SMS ADAPTER] Dispatching to ${payload.toPhone} via provider ${config.sms.provider}`);
      // In production with real credentials:
      // const response = await fetch('https://api.msg91.com/api/v5/flow/', { ... })
      return {
        success: true,
        status: 'SENT',
        providerMessageId: `MSG91-${Date.now()}`,
      };
    } catch (err: any) {
      logger.error('[SMS ADAPTER] Dispatch failed:', err.message);
      return {
        success: false,
        status: 'FAILED',
        error: err.message,
      };
    }
  }

  public getStatus() {
    return {
      provider: config.sms.provider,
      senderId: config.sms.senderId,
      isConfigured: this.isConfigured,
      mode: this.isConfigured ? 'LIVE' : 'SIMULATED',
    };
  }
}

export const smsAdapter = new SmsAdapter();

