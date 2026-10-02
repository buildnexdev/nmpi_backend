import { Router } from 'express';
import { getNewsList, getNewsById, createNews } from '../controllers/newsController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { ROLES } from '../constants';

const router = Router();

router.get('/', getNewsList);
router.get('/:id', getNewsById);
router.post('/', authenticateJWT, requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]), createNews);

export default router;
