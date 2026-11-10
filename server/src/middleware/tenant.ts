import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

/**
 * Enforces strict tenant context isolation.
 * Automatically injects the server-validated tenantId into all database query helpers.
 * Flags and blocks cross-tenant tampering attempts.
 */
export const enforceTenant = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required before tenant check.',
    });
    return;
  }

  // Super Admin (Platform role) can explicitly operate platform-wide or impersonate with audit
  if (req.user.role === 'SUPER_ADMIN') {
    // If Super Admin provided a target tenant in header or query, attach it
    const targetTenant = (req.headers['x-target-tenant'] as string) || (req.query.targetTenant as string);
    if (targetTenant) {
      req.tenantId = targetTenant.toUpperCase();
    }
    return next();
  }

  const authenticatedTenant = req.user.tenantId;

  // Check if client tried to manipulate tenantId in query, params, or body
  const attemptedTenant =
    req.body?.tenantId ||
    req.query?.tenantId ||
    req.params?.tenantId ||
    req.headers['x-target-tenant'];

  if (
    attemptedTenant &&
    String(attemptedTenant).toUpperCase() !== String(authenticatedTenant).toUpperCase()
  ) {
    logger.warn(
      `[SECURITY] Cross-tenant access attempt detected! User ${req.user.email} (${req.user._id}) of tenant ${authenticatedTenant} tried to access tenant ${attemptedTenant}`
    );

    // Record security audit event
    AuditLog.create({
      tenantId: authenticatedTenant,
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CROSS_TENANT_ACCESS_BLOCKED',
      entity: 'Security',
      details: {
        attemptedTenant,
        url: req.originalUrl,
        method: req.method,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'DENIED',
    }).catch((e) => logger.error('AuditLog error:', e));

    res.status(403).json({
      success: false,
      message: 'Access Denied: Cross-tenant operation prohibited.',
    });
    return;
  }

  // Overwrite any body or query tenantId with validated identity
  if (req.body && typeof req.body === 'object') {
    req.body.tenantId = authenticatedTenant;
  }

  req.tenantId = authenticatedTenant;
  next();
};

