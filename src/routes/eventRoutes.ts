import { Router } from 'express';
import { listEvents, listAllEvents, getEvent, createEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { CONTENT_ADMIN_ROLES } from '../constants';

const router = Router();
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];

router.get('/', listEvents);
router.get('/admin/list', ...admins, listAllEvents);
router.get('/:id', getEvent);
router.post('/', ...admins, createEvent);
router.put('/:id', ...admins, updateEvent);
router.delete('/:id', ...admins, deleteEvent);

export default router;
