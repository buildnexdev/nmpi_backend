import { Router } from 'express';
import {
  getStates,
  getParliaments,
  getAssemblies,
  getDistricts,
  getBlocks,
  getVillages,
  getRoles
} from '../controllers/masterDataController';

const router = Router();

router.get('/states', getStates);
router.get('/parliaments', getParliaments);
router.get('/assemblies', getAssemblies);
router.get('/districts', getDistricts);
router.get('/blocks', getBlocks);
router.get('/villages', getVillages);
router.get('/roles', getRoles);

export default router;
