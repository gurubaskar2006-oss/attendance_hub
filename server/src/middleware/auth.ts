import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, IUser } from '../models/User';
import { Tenant } from '../models/Tenant';
import { SoftwareLicense } from '../models/SoftwareLicense';

export interface AuthRequest extends Request {
  user?: IUser;
  tenantId?: string;
  isPlatformAdmin?: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Strictly check Authorization header: Bearer <token> or secure HTTP-only cookie.
    // Query string tokens are explicitly prohibited to prevent token leakage in server logs, browser history, and referrers.
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
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
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    // Fetch user from DB
    const user = await User.findById(decoded.userId);
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
      const tenant = await Tenant.findOne({ tenantId: req.tenantId });
      if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') {
        res.status(403).json({
          success: false,
          message: 'School account is suspended or inactive. Please contact 6th Civilians Corporation support.',
        });
        return;
      }

      // Check license
      const license = await SoftwareLicense.findOne({ tenantId: req.tenantId });
      if (license && (license.status === 'SUSPENDED' || license.status === 'REVOKED')) {
        res.status(403).json({
          success: false,
          message: 'School software license is suspended or revoked. Please verify license status.',
        });
        return;
      }
    }

    next();
  } catch (err: any) {
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

