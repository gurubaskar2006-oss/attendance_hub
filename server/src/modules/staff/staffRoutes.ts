import { Router } from 'express';
import {
  getStaffList,
  createStaff,
  getStaffById,
  toggleStaffStatus,
  resetStaffPassword,
} from './staffController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', getStaffList);
router.post('/', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), createStaff);
router.get('/:id', getStaffById);
router.patch('/:id/status', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), toggleStaffStatus);
router.post('/:id/reset-password', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), resetStaffPassword);

export default router;

