"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memberController_1 = require("../controllers/memberController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
// Public registration & duplicate check endpoints
router.get('/check-phone', memberController_1.checkPhone);
router.get('/check-aadhaar', memberController_1.checkAadhaar);
router.get('/check-voter-id', memberController_1.checkVoterId);
router.post('/register', uploadMiddleware_1.uploadProfileImage.single('profile_image'), memberController_1.registerMember);
router.get('/:memberId/id-card', memberController_1.downloadIdCardPdf);
// General member endpoints
router.get('/', memberController_1.getMembers);
router.get('/:id', memberController_1.getMemberById);
router.get('/:id/qr', memberController_1.getMemberQr);
exports.default = router;
