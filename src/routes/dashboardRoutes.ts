import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { ROLES } from '../constants';

const router = Router();

router.get('/statistics', authenticateJWT, requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRICT_ADMIN, ROLES.TALUK_ADMIN, ROLES.UNIT_ADMIN]), getDashboardStats);

export default router;
