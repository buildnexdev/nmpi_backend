import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe, changePassword } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.', data: null },
});

router.post('/login', loginLimiter, login);
router.get('/me', authenticateJWT, getMe);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
