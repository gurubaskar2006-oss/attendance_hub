import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from './announcementController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';
import { requireRole } from '../../middleware/role';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', getAnnouncements);
router.post('/', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'COORDINATOR']), createAnnouncement);
router.delete('/:id', requireRole(['SCHOOL_ADMIN', 'PRINCIPAL']), deleteAnnouncement);

export default router;

