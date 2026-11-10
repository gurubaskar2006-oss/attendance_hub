import { Router } from 'express';
import {
  getParents,
  createParent,
  linkStudentToParent,
  unlinkStudent,
  getMyChildren,
} from './parentController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/children', getMyChildren);
router.get('/my-children', getMyChildren);
router.get('/', getParents);
router.post('/', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), createParent);
router.post('/link-child', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), linkStudentToParent);
router.delete('/unlink-child/:relationshipId', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), unlinkStudent);

export default router;
