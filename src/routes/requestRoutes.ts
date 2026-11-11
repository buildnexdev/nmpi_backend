import { Router } from 'express';
import {
  submitRequest,
  trackRequest,
  listMyRequests,
  listAllRequests,
  updateRequestStatus,
} from '../controllers/requestController';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { CONTENT_ADMIN_ROLES } from '../constants';

const router = Router();
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];

// Public / Member can submit a request
router.post('/', optionalAuthenticateJWT, submitRequest);

// Public / Member can track by unique ref number (e.g. NMPI-2026-001234)
router.get('/track/:refNo', trackRequest);

// Logged-in member can list their submitted requests
router.get('/my', optionalAuthenticateJWT, listMyRequests);

// Admin endpoints for backoffice / web application
router.get('/admin/list', ...admins, listAllRequests);
router.patch('/admin/:id/status', ...admins, updateRequestStatus);

export default router;

