import { Router } from 'express';
import { getAccessMatrix, saveAccessMatrix } from '../controllers/accessController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { ROLE_CODES } from '../utils/roles';

const router = Router();

router.get('/matrix', authenticateJWT, requireRoles([ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN]), getAccessMatrix);
router.put('/matrix', authenticateJWT, requireRoles([ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN]), saveAccessMatrix);

export default router;
