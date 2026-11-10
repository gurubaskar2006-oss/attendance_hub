import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models/User';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    // Super Admin and School Admin have wildcard access within their scopes
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'SCHOOL_ADMIN') {
      return next();
    }

    if (!req.user.permissions?.includes(permission)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${permission}].`,
      });
      return;
    }

    next();
  };
};

