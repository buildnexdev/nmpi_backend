"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verificationController_1 = require("../controllers/verificationController");
const router = (0, express_1.Router)();
// Public QR Member Verification Endpoint
router.get('/member/:token', verificationController_1.verifyMemberToken);
exports.default = router;
