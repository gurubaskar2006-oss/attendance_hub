import { Router } from 'express';
import {
  getAcademicYears,
  createAcademicYear,
  setCurrentAcademicYear,
  getClasses,
  createClass,
  createSection,
  getSubjects,
  createSubject,
  getAllocations,
  createAllocation,
  deleteAllocation,
} from './academicController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

// Academic Years
router.get('/years', getAcademicYears);
router.post('/years', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), createAcademicYear);
router.patch('/years/:id/set-current', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), setCurrentAcademicYear);

// Classes & Sections
router.get('/classes', getClasses);
router.post('/classes', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), createClass);
router.post('/sections', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), createSection);

// Subjects
router.get('/subjects', getSubjects);
router.post('/subjects', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), createSubject);

// Allocations
router.get('/allocations', getAllocations);
router.post('/allocations', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), createAllocation);
router.delete('/allocations/:id', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), deleteAllocation);

export default router;

