import { Router } from 'express';
import {
  getStates,
  getParliaments,
  getAssemblies,
  getDistricts,
  getBlocks,
  getVillages,
  getRoles,
  getAllRoles,
} from '../controllers/masterDataController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { STAFF_ROLES } from '../constants';

const router = Router();

router.get('/states', getStates);
router.get('/parliaments', getParliaments);
router.get('/assemblies', getAssemblies);
router.get('/districts', getDistricts);
router.get('/blocks', getBlocks);
router.get('/villages', getVillages);
router.get('/roles', getRoles);
router.get('/roles/all', authenticateJWT, requireRoles(STAFF_ROLES), getAllRoles);

export default router;
