import { Router } from 'express';
import {
  getAttendanceSheet,
  markAttendance,
  correctAttendance,
  reopenAttendance,
  getAttendanceAnalytics,
  getAttendanceCalendar,
} from './attendanceController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

// Attendance routes
router.get('/sheet', getAttendanceSheet);
router.post('/mark', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']), markAttendance);
router.post('/correct', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), correctAttendance);
router.patch('/reopen', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), reopenAttendance);
router.get('/analytics', getAttendanceAnalytics);
router.get('/calendar', getAttendanceCalendar);

export default router;

