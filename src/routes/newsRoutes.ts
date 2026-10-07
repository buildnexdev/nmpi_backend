import { Router } from 'express';
import { listPublished, listAll, getPublished, createNews, updateNews, deleteNews } from '../controllers/newsController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { CONTENT_ADMIN_ROLES } from '../constants';

const router = Router();
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];

router.get('/', listPublished);
router.get('/admin/list', ...admins, listAll);
router.get('/:id', getPublished);
router.post('/', ...admins, createNews);
router.put('/:id', ...admins, updateNews);
router.delete('/:id', ...admins, deleteNews);

export default router;
