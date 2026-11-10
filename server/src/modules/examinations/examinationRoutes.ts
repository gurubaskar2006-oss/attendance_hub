import { Router } from 'express';
import {
  getExaminations,
  createExamination,
  configureExamSubject,
  getMarksSheet,
  saveMarks,
  publishResults,
  getStudentReportCard,
} from './examinationController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', getExaminations);
router.post('/', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), createExamination);
router.post('/:id/subjects', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), configureExamSubject);
router.get('/subjects/:examSubjectId/marks', getMarksSheet);
router.post('/subjects/:examSubjectId/marks', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']), saveMarks);
router.patch('/:id/publish', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), publishResults);
router.get('/student/:studentId/report-card/:examinationId', getStudentReportCard);

export default router;

