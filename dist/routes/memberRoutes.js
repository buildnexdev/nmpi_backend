"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memberController_1 = require("../controllers/memberController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const response_1 = require("../utils/response");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const roles_1 = require("../utils/roles");
const router = (0, express_1.Router)();
// Wrap multer so invalid / oversized images come back as a clean 400 on the profile_image field
function handleProfileUpload(req, res, next) {
    // `as any`: @types/multer ships its own copy of express-serve-static-core, so the Request types don't unify
    uploadMiddleware_1.uploadProfileImage.single('profile_image')(req, res, (err) => {
        if (!err)
            return next();
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'The image must be smaller than 5 MB.'
            : err.message || 'Invalid profile image.';
        return (0, response_1.sendError)(res, message, 'VALIDATION_ERROR', 400, { field: 'profile_image' });
    });
}
// Public registration & duplicate check endpoints
router.get('/check-phone', memberController_1.checkPhone);
router.get('/check-email', memberController_1.checkEmail);
router.get('/check-aadhaar', memberController_1.checkAadhaar);
router.get('/check-voter-id', memberController_1.checkVoterId);
router.post('/register', handleProfileUpload, memberController_1.registerMember);
// Authenticated member portal (must be before /:id and /:memberId wildcards)
router.get('/me', authMiddleware_1.authenticateJWT, memberController_1.getMyProfile);
router.get('/me/id-card', authMiddleware_1.authenticateJWT, memberController_1.downloadMyIdCard);
// ID card downloads (token route must be declared before the /:memberId wildcard)
router.get('/id-card/download', memberController_1.downloadIdCardByToken);
router.get('/:memberId/id-card', memberController_1.downloadIdCardPdf);
// General member endpoints
router.get('/', authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)([...roles_1.STAFF_ROLE_CODES]), memberController_1.getMembers);
router.get('/:id', memberController_1.getMemberById);
router.get('/:id/qr', memberController_1.getMemberQr);
exports.default = router;
