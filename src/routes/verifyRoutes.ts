import { Router } from 'express';
import { verifyMemberToken } from '../controllers/verificationController';

const router = Router();

// Public QR Member Verification Endpoint
router.get('/member/:token', verifyMemberToken);

export default router;
