import { Router, Request, Response, NextFunction } from 'express';
import {
  checkPhone,
  checkEmail,
  checkAadhaar,
  checkVoterId,
  registerMember,
  downloadIdCardWithToken,
  downloadMyIdCard,
  downloadMemberIdCard,
  getMyProfile,
  getMembers,
  exportMembersCsv,
  getMemberById,
  updateMemberStatus,
  updateMemberRole,
} from '../controllers/memberController';
import { uploadProfileImage } from '../middleware/uploadMiddleware';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/rbacMiddleware';
import { CONTENT_ADMIN_ROLES, STAFF_ROLES } from '../constants';

const router = Router();

// Public registration & duplicate checks
router.get('/check-phone', checkPhone);
router.get('/check-email', checkEmail);
router.get('/check-aadhaar', checkAadhaar);
router.get('/check-voter-id', checkVoterId);
router.post('/register', uploadProfileImage.single('profile_image'), registerMember);
router.get('/id-card/download', downloadIdCardWithToken);

// Logged-in member
router.get('/me', authenticateJWT, getMyProfile);
router.get('/me/id-card', authenticateJWT, downloadMyIdCard);

// Staff / administrators
const staff = [authenticateJWT, requireRoles(STAFF_ROLES)];
const admins = [authenticateJWT, requireRoles(CONTENT_ADMIN_ROLES)];

router.get('/', ...staff, getMembers);
router.get('/export.csv', ...staff, exportMembersCsv);
router.get('/:id', ...staff, getMemberById);
router.get('/:id/id-card', ...staff, downloadMemberIdCard);
router.patch('/:id/status', ...staff, updateMemberStatus);
router.patch('/:id/role', ...admins, updateMemberRole);

export default router;
