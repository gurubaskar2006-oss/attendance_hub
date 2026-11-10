import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { SoftwareLicense } from '../../models/SoftwareLicense';
import { AuditLog } from '../../models/AuditLog';
import { config } from '../../config/env';
import { AuthRequest } from '../../middleware/auth';

const generateTokens = (user: IUser) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };

  const accessToken = jwt.sign({ ...payload, jti: crypto.randomUUID() }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  const refreshToken = jwt.sign({ ...payload, jti: crypto.randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });

  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response): Promise<void> => {
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
    const userQuery: any = {
      $or: [{ email: email.toLowerCase() }, { phone: email }],
    };

    // If school code provided, resolve tenant
    if (schoolCode && schoolCode.toUpperCase() !== 'PLATFORM') {
      const tenant = await Tenant.findOne({ code: schoolCode.toUpperCase() });
      if (!tenant) {
        res.status(404).json({
          success: false,
          message: `School with code "${schoolCode}" not found.`,
        });
        return;
      }
      userQuery.tenantId = tenant.tenantId;
    }

    const user = await User.findOne(userQuery);

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
    let tenantInfo: any = null;
    let licenseInfo: any = null;

    if (user.role !== 'SUPER_ADMIN' && user.tenantId !== 'PLATFORM') {
      tenantInfo = await Tenant.findOne({ tenantId: user.tenantId });
      if (!tenantInfo || tenantInfo.status === 'SUSPENDED' || tenantInfo.status === 'INACTIVE') {
        res.status(403).json({
          success: false,
          message: 'School account is suspended or inactive. Please contact 6th Civilians Corporation support.',
        });
        return;
      }

      licenseInfo = await SoftwareLicense.findOne({ tenantId: user.tenantId });
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
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshToken = refreshToken;
    user.refreshTokenHash = tokenHash;
    user.revokedTokenHashes = [];
    await user.save();

    // Log successful login audit
    AuditLog.create({
      tenantId: user.tenantId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      entity: 'Auth',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS',
    }).catch(() => {});

    // Set cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: config.env === 'production',
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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
      error: err.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let tenantInfo = null;
    let licenseInfo = null;

    if (user.tenantId !== 'PLATFORM') {
      tenantInfo = await Tenant.findOne({ tenantId: user.tenantId });
      licenseInfo = await SoftwareLicense.findOne({ tenantId: user.tenantId });
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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user context.',
      error: err.message,
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Error during logout.',
      error: err.message,
    });
  }
};

/**
 * Exchange valid refresh token for a newly rotated access and refresh token pair
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
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
    let decoded: any;
    try {
      decoded = jwt.verify(rawRefreshToken, config.jwt.refreshSecret);
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please log in again.',
      });
      return;
    }

    // 2. Compute hash of presented token
    const presentedHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // 3. Find user
    const user = await User.findById(decoded.userId);
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

      AuditLog.create({
        tenantId: user.tenantId,
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: 'REFRESH_TOKEN_REPLAY_DETECTED',
        entity: 'Security',
        details: { ip: req.ip, userAgent: req.get('user-agent') },
        status: 'DENIED',
      }).catch(() => {});

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
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    // Add old hash to revoked history
    const revoked = user.revokedTokenHashes || [];
    revoked.push(presentedHash);
    if (revoked.length > 20) revoked.shift(); // Keep last 20
    user.revokedTokenHashes = revoked;

    user.refreshTokenHash = newHash;
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: config.env === 'production',
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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh authentication token.',
      error: err.message,
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

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

    const bcrypt = await import('bcryptjs');
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.refreshToken = undefined;
    user.refreshTokenHash = undefined;
    user.revokedTokenHashes = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: err.message,
    });
  }
};
