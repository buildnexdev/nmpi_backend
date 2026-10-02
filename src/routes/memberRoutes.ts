import { Router } from 'express';
import { getMembers, getMemberById, getMyProfile, updateStatus, getMemberQr } from '../controllers/memberController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { ROLES } from '../constants';

const router = Router();

router.get('/me', authenticateJWT, getMyProfile);
router.get('/:id/qr', authenticateJWT, getMemberQr);

// Administrative member management routes
router.get('/', authenticateJWT, requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRICT_ADMIN, ROLES.TALUK_ADMIN, ROLES.UNIT_ADMIN]), getMembers);
router.get('/:id', authenticateJWT, requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRICT_ADMIN, ROLES.TALUK_ADMIN, ROLES.UNIT_ADMIN]), getMemberById);
router.patch('/:id/status', authenticateJWT, requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRICT_ADMIN, ROLES.TALUK_ADMIN]), updateStatus);

export default router;
