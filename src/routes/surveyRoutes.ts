import { Router } from 'express';
import {
  listSurveys,
  getSurvey,
  createSurvey,
  submitSurvey,
  updateSurveyStatus,
} from '../controllers/surveyController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { CONTENT_ADMIN_ROLES } from '../constants';

const router = Router();
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];

router.get('/', authenticateJWT, listSurveys);
router.get('/:id', authenticateJWT, getSurvey);
router.post('/', ...admins, createSurvey);
router.post('/:id/submit', authenticateJWT, submitSurvey);
router.patch('/:id/status', ...admins, updateSurveyStatus);

export default router;
