import { Router } from 'express';
import { listReels, createReel, viewReel, toggleReelLike, deleteReel } from '../controllers/reelController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { CONTENT_ADMIN_ROLES } from '../constants';

const router = Router();
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];

router.get('/', authenticateJWT, listReels);
router.post('/', ...admins, createReel);
router.post('/:id/view', authenticateJWT, viewReel);
router.post('/:id/like', authenticateJWT, toggleReelLike);
router.delete('/:id', ...admins, deleteReel);

export default router;
