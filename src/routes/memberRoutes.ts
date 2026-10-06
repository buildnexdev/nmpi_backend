import { Router, Request, Response, NextFunction } from 'express';
import {
  checkPhone,
  checkEmail,
  checkAadhaar,
  checkVoterId,
  registerMember,
  downloadIdCardPdf,
  downloadIdCardByToken,
  downloadMyIdCard,
  getMembers,
  getMemberById,
  getMyProfile,
  getMemberQr
} from '../controllers/memberController';
import { uploadProfileImage } from '../middleware/uploadMiddleware';
import { sendError } from '../utils/response';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { STAFF_ROLE_CODES } from '../utils/roles';

const router = Router();

// Wrap multer so invalid / oversized images come back as a clean 400 on the profile_image field
function handleProfileUpload(req: Request, res: Response, next: NextFunction) {
  // `as any`: @types/multer ships its own copy of express-serve-static-core, so the Request types don't unify
  uploadProfileImage.single('profile_image')(req as any, res as any, (err: any) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'The image must be smaller than 5 MB.'
      : err.message || 'Invalid profile image.';
    return sendError(res, message, 'VALIDATION_ERROR', 400, { field: 'profile_image' });
  });
}

// Public registration & duplicate check endpoints
router.get('/check-phone', checkPhone);
router.get('/check-email', checkEmail);
router.get('/check-aadhaar', checkAadhaar);
router.get('/check-voter-id', checkVoterId);
router.post('/register', handleProfileUpload, registerMember);

// Authenticated member portal (must be before /:id and /:memberId wildcards)
router.get('/me', authenticateJWT, getMyProfile);
router.get('/me/id-card', authenticateJWT, downloadMyIdCard);

// ID card downloads (token route must be declared before the /:memberId wildcard)
router.get('/id-card/download', downloadIdCardByToken);
router.get('/:memberId/id-card', downloadIdCardPdf);

// General member endpoints
router.get('/', authenticateJWT, requireRoles([...STAFF_ROLE_CODES]), getMembers);
router.get('/:id', getMemberById);
router.get('/:id/qr', getMemberQr);

export default router;
