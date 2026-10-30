import { Router } from 'express';
import {
  listEvents,
  listAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  checkInEvent,
  myEventRsvp,
  listEventRsvps,
} from '../controllers/eventController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { CONTENT_ADMIN_ROLES, STAFF_ROLES } from '../constants';

const router = Router();
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];
const staff = [authenticateJWT, requireRoles(STAFF_ROLES)];

router.get('/', listEvents);
router.get('/admin/list', ...admins, listAllEvents);
router.get('/:id/rsvp/me', authenticateJWT, myEventRsvp);
router.get('/:id/rsvps', ...staff, listEventRsvps);
router.post('/:id/rsvp', authenticateJWT, rsvpEvent);
router.post('/:id/check-in', authenticateJWT, checkInEvent);
router.get('/:id', getEvent);
router.post('/', ...admins, createEvent);
router.put('/:id', ...admins, updateEvent);
router.delete('/:id', ...admins, deleteEvent);

export default router;
