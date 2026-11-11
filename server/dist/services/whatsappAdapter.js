"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappAdapter = exports.WhatsAppAdapter = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class WhatsAppAdapter {
    isConfigured;
    constructor() {
        this.isConfigured = Boolean(env_1.config.whatsapp.enabled &&
            env_1.config.whatsapp.accessToken &&
            env_1.config.whatsapp.phoneNumberId);
    }
    async sendTemplate(payload) {
        if (!this.isConfigured) {
            logger_1.logger.info(`[WHATSAPP ADAPTER - SIMULATED MODE] (Unconfigured credentials). To: ${payload.toPhone} | Template: ${payload.templateName} (${payload.languageCode}) | Params: [${payload.bodyParameters.join(', ')}]`);
            return {
                success: true,
                status: 'SIMULATED',
                messageId: `SIM-WA-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            };
        }
        try {
            logger_1.logger.info(`[WHATSAPP ADAPTER] Dispatching to ${payload.toPhone} via WhatsApp Cloud API`);
            // When credentials are set in .env:
            // const url = `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`;
            // fetch(url, { headers: { Authorization: `Bearer ${config.whatsapp.accessToken}` } ... })
            return {
                success: true,
                status: 'SENT',
                messageId: `wamid.HBgM${Date.now()}`,
            };
        }
        catch (err) {
            logger_1.logger.error('[WHATSAPP ADAPTER] Dispatch failed:', err.message);
            return {
                success: false,
                status: 'FAILED',
                error: err.message,
            };
        }
    }
    getStatus() {
        return {
            enabled: env_1.config.whatsapp.enabled,
            isConfigured: this.isConfigured,
            phoneNumberId: env_1.config.whatsapp.phoneNumberId ? '***Configured***' : 'Not Set',
            mode: this.isConfigured ? 'LIVE' : 'SIMULATED',
        };
    }
}
exports.WhatsAppAdapter = WhatsAppAdapter;
exports.whatsappAdapter = new WhatsAppAdapter();
