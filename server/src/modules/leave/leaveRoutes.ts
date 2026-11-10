import { Router } from 'express';
import {
  getLeaveRequests,
  submitLeaveRequest,
  reviewLeaveRequest,
} from './leaveController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', getLeaveRequests);
router.post('/', requireRole(['PARENT', 'SCHOOL_ADMIN']), submitLeaveRequest);
router.patch('/:id/review', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']), reviewLeaveRequest);

export default router;

