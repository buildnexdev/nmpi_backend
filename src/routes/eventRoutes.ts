import { Router } from 'express';
import { getEvents, getEventById, createEvent } from '../controllers/eventController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { ROLES } from '../constants';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticateJWT, requireRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]), createEvent);

export default router;
