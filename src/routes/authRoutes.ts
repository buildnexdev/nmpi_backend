import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, sendOtp, verifyOtp, getMe, changePassword } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.', data: null },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many OTP attempts. Please try again later.', data: null },
});

router.post('/login', loginLimiter, login);
router.post('/otp/send', otpLimiter, sendOtp);
router.post('/otp/verify', otpLimiter, verifyOtp);
router.get('/me', authenticateJWT, getMe);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
