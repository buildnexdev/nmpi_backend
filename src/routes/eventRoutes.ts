import { Router } from 'express';
import { getEvents, getEventById, getEventsAdminList, createEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requirePage } from '../middleware/rbacMiddleware';

const router = Router();

router.get('/', getEvents);
router.get('/admin/list', authenticateJWT, requirePage('events'), getEventsAdminList);
router.get('/:id', getEventById);
router.post('/', authenticateJWT, requirePage('events'), createEvent);
router.put('/:id', authenticateJWT, requirePage('events'), updateEvent);
router.delete('/:id', authenticateJWT, requirePage('events'), deleteEvent);

export default router;
