import { Router } from 'express';
import { listFeed, createPost, toggleLike, deletePost } from '../controllers/feedController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateJWT, listFeed);
router.post('/', authenticateJWT, createPost);
router.post('/:id/like', authenticateJWT, toggleLike);
router.delete('/:id', authenticateJWT, deletePost);

export default router;
