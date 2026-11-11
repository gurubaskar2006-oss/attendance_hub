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
exports.changePassword = exports.refresh = exports.logout = exports.getMe = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../../models/User");
const Tenant_1 = require("../../models/Tenant");
const SoftwareLicense_1 = require("../../models/SoftwareLicense");
const AuditLog_1 = require("../../models/AuditLog");
const env_1 = require("../../config/env");
const generateTokens = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
    };
    const accessToken = jsonwebtoken_1.default.sign({ ...payload, jti: crypto_1.default.randomUUID() }, env_1.config.jwt.secret, {
        expiresIn: env_1.config.jwt.expiresIn,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ ...payload, jti: crypto_1.default.randomUUID() }, env_1.config.jwt.refreshSecret, {
        expiresIn: env_1.config.jwt.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
};
const login = async (req, res) => {
    try {
        const { email, password, schoolCode } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            });
            return;
        }
        // Build query
        const userQuery = {
            $or: [{ email: email.toLowerCase() }, { phone: email }],
        };
        // If school code provided, resolve tenant
        if (schoolCode && schoolCode.toUpperCase() !== 'PLATFORM') {
            const tenant = await Tenant_1.Tenant.findOne({ code: schoolCode.toUpperCase() });
            if (!tenant) {
                res.status(404).json({
                    success: false,
                    message: `School with code "${schoolCode}" not found.`,
                });
                return;
            }
            userQuery.tenantId = tenant.tenantId;
        }
        const user = await User_1.User.findOne(userQuery);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. User not found.',
            });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: 'This user account has been deactivated. Please contact your administrator.',
            });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. Incorrect password.',
            });
            return;
        }
        // Verify school status & license if not Super Admin
        let tenantInfo = null;
        let licenseInfo = null;
        if (user.role !== 'SUPER_ADMIN' && user.tenantId !== 'PLATFORM') {
            tenantInfo = await Tenant_1.Tenant.findOne({ tenantId: user.tenantId });
            if (!tenantInfo || tenantInfo.status === 'SUSPENDED' || tenantInfo.status === 'INACTIVE') {
                res.status(403).json({
                    success: false,
                    message: 'School account is suspended or inactive. Please contact 6th Civilians Corporation support.',
                });
                return;
            }
            licenseInfo = await SoftwareLicense_1.SoftwareLicense.findOne({ tenantId: user.tenantId });
            if (licenseInfo && (licenseInfo.status === 'SUSPENDED' || licenseInfo.status === 'REVOKED')) {
                res.status(403).json({
                    success: false,
                    message: 'School software license is inactive or suspended. Please contact platform administration.',
                });
                return;
            }
        }
        // Update last login
        user.lastLogin = new Date();
        const { accessToken, refreshToken } = generateTokens(user);
        const tokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        user.refreshToken = refreshToken;
        user.refreshTokenHash = tokenHash;
        user.revokedTokenHashes = [];
        await user.save();
        // Log successful login audit
        AuditLog_1.AuditLog.create({
            tenantId: user.tenantId,
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            action: 'USER_LOGIN_SUCCESS',
            entity: 'Auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS',
        }).catch(() => { });
        // Set cookie
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: env_1.config.env === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token: accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    tenantId: user.tenantId,
                    permissions: user.permissions,
                    avatarUrl: user.avatarUrl,
                },
                tenant: tenantInfo
                    ? {
                        tenantId: tenantInfo.tenantId,
                        name: tenantInfo.name,
                        code: tenantInfo.code,
                        affiliation: tenantInfo.affiliation,
                        logoUrl: tenantInfo.logoUrl,
                        settings: tenantInfo.settings,
                    }
                    : null,
                license: licenseInfo
                    ? {
                        licenseKey: licenseInfo.licenseKey,
                        tier: licenseInfo.tier,
                        status: licenseInfo.status,
                        modules: licenseInfo.licensedModules,
                    }
                    : null,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'An error occurred during authentication.',
            error: err.message,
        });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = req.user;
        let tenantInfo = null;
        let licenseInfo = null;
        if (user.tenantId !== 'PLATFORM') {
            tenantInfo = await Tenant_1.Tenant.findOne({ tenantId: user.tenantId });
            licenseInfo = await SoftwareLicense_1.SoftwareLicense.findOne({ tenantId: user.tenantId });
        }
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    tenantId: user.tenantId,
                    permissions: user.permissions,
                    avatarUrl: user.avatarUrl,
                    lastLogin: user.lastLogin,
                },
                tenant: tenantInfo,
                license: licenseInfo,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user context.',
            error: err.message,
        });
    }
};
exports.getMe = getMe;
const logout = async (req, res) => {
    try {
        if (req.user) {
            req.user.refreshToken = undefined;
            req.user.refreshTokenHash = undefined;
            req.user.revokedTokenHashes = [];
            await req.user.save();
        }
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error during logout.',
            error: err.message,
        });
    }
};
exports.logout = logout;
/**
 * Exchange valid refresh token for a newly rotated access and refresh token pair
 */
const refresh = async (req, res) => {
    try {
        const rawRefreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
        if (!rawRefreshToken) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required.',
            });
            return;
        }
        // 1. Verify token signature and expiration
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(rawRefreshToken, env_1.config.jwt.refreshSecret);
        }
        catch (err) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token. Please log in again.',
            });
            return;
        }
        // 2. Compute hash of presented token
        const presentedHash = crypto_1.default.createHash('sha256').update(rawRefreshToken).digest('hex');
        // 3. Find user
        const user = await User_1.User.findById(decoded.userId);
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: 'User account not found or inactive.',
            });
            return;
        }
        // 4. Protection against Refresh Token Replay / Reuse
        if (user.revokedTokenHashes && user.revokedTokenHashes.includes(presentedHash)) {
            // Replay detected! Invalidate all active sessions for this user
            user.refreshTokenHash = undefined;
            user.refreshToken = undefined;
            user.revokedTokenHashes = [];
            await user.save();
            AuditLog_1.AuditLog.create({
                tenantId: user.tenantId,
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                action: 'REFRESH_TOKEN_REPLAY_DETECTED',
                entity: 'Security',
                details: { ip: req.ip, userAgent: req.get('user-agent') },
                status: 'DENIED',
            }).catch(() => { });
            res.status(403).json({
                success: false,
                message: 'Security warning: Refresh token reuse detected. All sessions revoked. Please log in again.',
            });
            return;
        }
        // 5. Verify that token matches current active hash
        if (user.refreshTokenHash !== presentedHash) {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token.',
            });
            return;
        }
        // 6. Rotate Token: issue new access token & new refresh token
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        const newHash = crypto_1.default.createHash('sha256').update(newRefreshToken).digest('hex');
        // Add old hash to revoked history
        const revoked = user.revokedTokenHashes || [];
        revoked.push(presentedHash);
        if (revoked.length > 20)
            revoked.shift(); // Keep last 20
        user.revokedTokenHashes = revoked;
        user.refreshTokenHash = newHash;
        user.refreshToken = newRefreshToken;
        await user.save();
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: env_1.config.env === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully.',
            data: {
                token: accessToken,
                refreshToken: newRefreshToken,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to refresh authentication token.',
            error: err.message,
        });
    }
};
exports.refresh = refresh;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message: 'Current password and new password are required.',
            });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters.',
            });
            return;
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                message: 'Current password does not match.',
            });
            return;
        }
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        user.passwordHash = await bcrypt.hash(newPassword, 10);
        user.refreshToken = undefined;
        user.refreshTokenHash = undefined;
        user.revokedTokenHashes = [];
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password changed successfully.',
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password.',
            error: err.message,
        });
    }
};
exports.changePassword = changePassword;
