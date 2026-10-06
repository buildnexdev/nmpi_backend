import { Router } from 'express';
import { getNewsList, getNewsById, getNewsAdminList, createNews, updateNews, deleteNews } from '../controllers/newsController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requirePage } from '../middleware/rbacMiddleware';

const router = Router();

router.get('/', getNewsList);
router.get('/admin/list', authenticateJWT, requirePage('news'), getNewsAdminList);
router.get('/:id', getNewsById);
router.post('/', authenticateJWT, requirePage('news'), createNews);
router.put('/:id', authenticateJWT, requirePage('news'), updateNews);
router.delete('/:id', authenticateJWT, requirePage('news'), deleteNews);

export default router;
