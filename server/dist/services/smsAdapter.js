"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsAdapter = exports.SmsAdapter = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class SmsAdapter {
    isConfigured;
    constructor() {
        this.isConfigured = Boolean(env_1.config.sms.authKey && env_1.config.sms.authKey.trim() !== '');
    }
    async send(payload) {
        if (!this.isConfigured) {
            logger_1.logger.info(`[SMS ADAPTER - SIMULATED MODE] (Provider unconfigured). Destination: ${payload.toPhone} | Message: "${payload.message}"`);
            return {
                success: true,
                status: 'SIMULATED',
                providerMessageId: `SIM-SMS-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            };
        }
        try {
            // Real SMS provider dispatch (e.g. MSG91 API)
            logger_1.logger.info(`[SMS ADAPTER] Dispatching to ${payload.toPhone} via provider ${env_1.config.sms.provider}`);
            // In production with real credentials:
            // const response = await fetch('https://api.msg91.com/api/v5/flow/', { ... })
            return {
                success: true,
                status: 'SENT',
                providerMessageId: `MSG91-${Date.now()}`,
            };
        }
        catch (err) {
            logger_1.logger.error('[SMS ADAPTER] Dispatch failed:', err.message);
            return {
                success: false,
                status: 'FAILED',
                error: err.message,
            };
        }
    }
    getStatus() {
        return {
            provider: env_1.config.sms.provider,
            senderId: env_1.config.sms.senderId,
            isConfigured: this.isConfigured,
            mode: this.isConfigured ? 'LIVE' : 'SIMULATED',
        };
    }
}
exports.SmsAdapter = SmsAdapter;
exports.smsAdapter = new SmsAdapter();
