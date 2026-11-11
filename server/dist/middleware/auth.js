"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const Tenant_1 = require("../models/Tenant");
const SoftwareLicense_1 = require("../models/SoftwareLicense");
const authenticate = async (req, res, next) => {
    try {
        let token;
        // Strictly check Authorization header: Bearer <token> or secure HTTP-only cookie.
        // Query string tokens are explicitly prohibited to prevent token leakage in server logs, browser history, and referrers.
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Authentication token required. Please log in.',
            });
            return;
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        // Fetch user from DB
        const user = await User_1.User.findById(decoded.userId);
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: 'User session is invalid or account has been deactivated.',
            });
            return;
        }
        req.user = user;
        req.tenantId = user.tenantId;
        req.isPlatformAdmin = user.role === 'SUPER_ADMIN';
        // If user is school-scoped, check tenant and license status
        if (!req.isPlatformAdmin && req.tenantId !== 'PLATFORM') {
            const tenant = await Tenant_1.Tenant.findOne({ tenantId: req.tenantId });
            if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') {
                res.status(403).json({
                    success: false,
                    message: 'School account is suspended or inactive. Please contact 6th Civilians Corporation support.',
                });
                return;
            }
            // Check license
            const license = await SoftwareLicense_1.SoftwareLicense.findOne({ tenantId: req.tenantId });
            if (license && (license.status === 'SUSPENDED' || license.status === 'REVOKED')) {
                res.status(403).json({
                    success: false,
                    message: 'School software license is suspended or revoked. Please verify license status.',
                });
                return;
            }
        }
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Session expired. Please log in again.',
            });
            return;
        }
        res.status(401).json({
            success: false,
            message: 'Invalid authentication token.',
        });
    }
};
exports.authenticate = authenticate;
