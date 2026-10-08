"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memberController_1 = require("../controllers/memberController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
// Public registration & duplicate checks
router.get('/check-phone', memberController_1.checkPhone);
router.get('/check-email', memberController_1.checkEmail);
router.get('/check-aadhaar', memberController_1.checkAadhaar);
router.get('/check-voter-id', memberController_1.checkVoterId);
router.post('/register', uploadMiddleware_1.uploadProfileImage.single('profile_image'), memberController_1.registerMember);
router.get('/id-card/download', memberController_1.downloadIdCardWithToken);
// Logged-in member
router.get('/me', authMiddleware_1.authenticateJWT, memberController_1.getMyProfile);
router.get('/me/id-card', authMiddleware_1.authenticateJWT, memberController_1.downloadMyIdCard);
// Staff / administrators
const staff = [authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)(constants_1.STAFF_ROLES)];
const admins = [authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)(constants_1.CONTENT_ADMIN_ROLES)];
router.get('/', ...staff, memberController_1.getMembers);
router.get('/export.csv', ...staff, memberController_1.exportMembersCsv);
router.get('/:id', ...staff, memberController_1.getMemberById);
router.get('/:id/id-card', ...staff, memberController_1.downloadMemberIdCard);
router.patch('/:id/status', ...staff, memberController_1.updateMemberStatus);
router.patch('/:id/role', ...admins, memberController_1.updateMemberRole);
exports.default = router;
