import { Router } from 'express';
import {
  getPublicStats,
  listLeaders,
  listAllLeaders,
  createLeader,
  updateLeader,
  deleteLeader,
  listPages,
  getPage,
  savePage,
  listUploads,
  uploadMedia,
  deleteUpload,
} from '../controllers/cmsController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { uploadMediaImage } from '../middleware/uploadMiddleware';
import { CONTENT_ADMIN_ROLES } from '../constants';

const router = Router();
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];

router.get('/public-stats', getPublicStats);
router.get('/leadership', listLeaders);
router.get('/leadership/admin/list', ...admins, listAllLeaders);
router.post('/leadership', ...admins, createLeader);
router.put('/leadership/:id', ...admins, updateLeader);
router.delete('/leadership/:id', ...admins, deleteLeader);

router.get('/pages', ...admins, listPages);
router.get('/pages/:key', getPage);
router.put('/pages/:key', ...admins, savePage);

router.get('/uploads/list', listUploads);
router.post('/uploads', ...admins, uploadMediaImage.single('file'), uploadMedia);
router.delete('/uploads/:filename', ...admins, deleteUpload);

export default router;
