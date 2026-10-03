import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { STAFF_ROLES } from '../constants';

const router = Router();

router.get('/statistics', authenticateJWT, requireRoles(STAFF_ROLES), getDashboardStats);

export default router;
