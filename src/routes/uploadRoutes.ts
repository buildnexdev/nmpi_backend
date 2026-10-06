import { Router } from 'express';
import { listUploads, createUpload, deleteUpload } from '../controllers/uploadController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { uploadMediaImage } from '../middleware/uploadMiddleware';
import { STAFF_ROLE_CODES } from '../utils/roles';
import { sendError } from '../utils/response';

const router = Router();
const staff = [authenticateJWT, requireRoles([...STAFF_ROLE_CODES])];

router.get('/list', listUploads);
router.post('/', authenticateJWT, requireRoles([...STAFF_ROLE_CODES]), (req, res, next) => {
  uploadMediaImage.single('file')(req as any, res as any, (err: any) => {
    if (err) return sendError(res, err.message || 'Upload failed', 'VALIDATION_ERROR', 400);
    next();
  });
}, createUpload);
router.delete('/:filename', ...staff, deleteUpload);

export default router;
