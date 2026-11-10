import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  bulkImportStudents,
  promoteStudents,
} from './studentController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), createStudent);
router.put('/:id', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), updateStudent);
router.post('/bulk-import', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), bulkImportStudents);
router.post('/promote', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), promoteStudents);

export default router;

