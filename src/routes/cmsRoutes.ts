import { Router } from 'express';
import {
  getLeaders,
  getLeadersAdmin,
  createLeader,
  updateLeader,
  deleteLeader,
  getPage,
  getPages,
  updatePage,
  getGalleryAlbums,
  getGeography,
  getPublicStats,
} from '../controllers/cmsController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requirePage } from '../middleware/rbacMiddleware';

const router = Router();

router.get('/public-stats', getPublicStats);
router.get('/geography', getGeography);
router.get('/gallery/albums', getGalleryAlbums);

router.get('/leadership/admin/list', authenticateJWT, requirePage('leadership'), getLeadersAdmin);
router.post('/leadership', authenticateJWT, requirePage('leadership'), createLeader);
router.put('/leadership/:id', authenticateJWT, requirePage('leadership'), updateLeader);
router.delete('/leadership/:id', authenticateJWT, requirePage('leadership'), deleteLeader);
router.get('/leadership', getLeaders);

router.get('/pages', authenticateJWT, requirePage('pages'), getPages);
router.put('/pages/:key', authenticateJWT, requirePage('pages'), updatePage);
router.get('/pages/:key', getPage);

export default router;
