"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
dotenv_1.default.config(); // fallback to current dir .env if exists
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    jwt: {
        secret: process.env.JWT_SECRET || 'dev_secret_jwt_key_school_operations_platform_2026',
        expiresIn: process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '15m' : '1d'),
        refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key_school_operations_platform_2026',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_secret_key_2026_min_32_chars',
    },
    rateLimit: {
        loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10),
        loginWindowMs: 15 * 60 * 1000, // 15 minutes
    },
    db: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/school_operations_platform',
    },
    redis: {
        url: process.env.REDIS_URL || '',
    },
    storage: {
        driver: (process.env.STORAGE_DRIVER || 'local'),
        localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
        s3: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            region: process.env.AWS_REGION || 'ap-south-1',
            bucket: process.env.AWS_S3_BUCKET || '',
        }
    },
    sms: {
        provider: process.env.SMS_PROVIDER || 'msg91',
        authKey: process.env.SMS_AUTH_KEY || '',
        senderId: process.env.SMS_SENDER_ID || 'SCHOPS',
        route: process.env.SMS_ROUTE || '4',
    },
    whatsapp: {
        enabled: process.env.WHATSAPP_ENABLED === 'true',
        apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    },
    cors: {
        clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
    }
};
