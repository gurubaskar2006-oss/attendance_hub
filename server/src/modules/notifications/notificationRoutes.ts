import { Router } from 'express';
import {
  getNotifications,
  getMyNotifications,
  markNotificationRead,
  getProvidersStatus,
} from './notificationController';
import { authenticate } from '../../middleware/auth';
import { enforceTenant } from '../../middleware/tenant';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', getNotifications);
router.get('/my', getMyNotifications);
router.patch('/:id/read', markNotificationRead);
router.get('/providers/status', getProvidersStatus);

export default router;

