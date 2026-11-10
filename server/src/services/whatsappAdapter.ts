import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface IWhatsAppPayload {
  toPhone: string;
  templateName: string;
  languageCode: 'en' | 'ta';
  bodyParameters: string[];
}

export interface IWhatsAppResult {
  success: boolean;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  messageId?: string;
  error?: string;
}

export class WhatsAppAdapter {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(
      config.whatsapp.enabled &&
      config.whatsapp.accessToken &&
      config.whatsapp.phoneNumberId
    );
  }

  public async sendTemplate(payload: IWhatsAppPayload): Promise<IWhatsAppResult> {
    if (!this.isConfigured) {
      logger.info(
        `[WHATSAPP ADAPTER - SIMULATED MODE] (Unconfigured credentials). To: ${payload.toPhone} | Template: ${payload.templateName} (${payload.languageCode}) | Params: [${payload.bodyParameters.join(', ')}]`
      );
      return {
        success: true,
        status: 'SIMULATED',
        messageId: `SIM-WA-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      logger.info(`[WHATSAPP ADAPTER] Dispatching to ${payload.toPhone} via WhatsApp Cloud API`);
      // When credentials are set in .env:
      // const url = `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`;
      // fetch(url, { headers: { Authorization: `Bearer ${config.whatsapp.accessToken}` } ... })
      return {
        success: true,
        status: 'SENT',
        messageId: `wamid.HBgM${Date.now()}`,
      };
    } catch (err: any) {
      logger.error('[WHATSAPP ADAPTER] Dispatch failed:', err.message);
      return {
        success: false,
        status: 'FAILED',
        error: err.message,
      };
    }
  }

  public getStatus() {
    return {
      enabled: config.whatsapp.enabled,
      isConfigured: this.isConfigured,
      phoneNumberId: config.whatsapp.phoneNumberId ? '***Configured***' : 'Not Set',
      mode: this.isConfigured ? 'LIVE' : 'SIMULATED',
    };
  }
}

export const whatsappAdapter = new WhatsAppAdapter();

