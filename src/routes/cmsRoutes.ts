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
} from '../controllers/cmsController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
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

export default router;
