import { Router } from 'express';
import {
  getPlatformDashboard,
  getSchools,
  createSchool,
  updateSchoolStatus,
  getLicenses,
  updateLicenseStatus,
  transferLicense,
  getPlatformSettings,
  getAuditLogs,
} from './platformController';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';

const router = Router();

// Protect all routes with Super Admin check
router.use(authenticate, requireRole(['SUPER_ADMIN']));

router.get('/dashboard', getPlatformDashboard);
router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.patch('/schools/:tenantId/status', updateSchoolStatus);

router.get('/licenses', getLicenses);
router.patch('/licenses/:licenseKey/status', updateLicenseStatus);
router.post('/licenses/:licenseKey/transfer', transferLicense);

router.get('/settings', getPlatformSettings);
router.get('/audit-logs', getAuditLogs);

export default router;

