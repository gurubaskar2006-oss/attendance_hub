import { Router } from 'express';
import {
  downloadReportCardPdf,
  downloadMonthlyAttendancePdf,
} from './reportController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/student/:studentId/exam/:examinationId/pdf', downloadReportCardPdf);
router.get('/class/:classId/section/:sectionId/monthly-attendance/pdf', downloadMonthlyAttendancePdf);

export default router;

