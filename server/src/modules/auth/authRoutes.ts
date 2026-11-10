import { Router } from 'express';
import { login, getMe, logout, changePassword, refresh } from './authController';
import { authenticate } from '../../middleware/auth';
import { loginRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, changePassword);

export default router;

