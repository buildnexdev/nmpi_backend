import { Router } from 'express';
import {
  checkPhone,
  checkAadhaar,
  checkVoterId,
  registerMember,
  downloadIdCardPdf,
  getMembers,
  getMemberById,
  getMemberQr
} from '../controllers/memberController';
import { uploadProfileImage } from '../middleware/uploadMiddleware';

const router = Router();

// Public registration & duplicate check endpoints
router.get('/check-phone', checkPhone);
router.get('/check-aadhaar', checkAadhaar);
router.get('/check-voter-id', checkVoterId);
router.post('/register', uploadProfileImage.single('profile_image'), registerMember);
router.get('/:memberId/id-card', downloadIdCardPdf);

// General member endpoints
router.get('/', getMembers);
router.get('/:id', getMemberById);
router.get('/:id/qr', getMemberQr);

export default router;
