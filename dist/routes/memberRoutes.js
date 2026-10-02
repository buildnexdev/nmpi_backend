"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memberController_1 = require("../controllers/memberController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
router.get('/me', authMiddleware_1.authenticateJWT, memberController_1.getMyProfile);
router.get('/:id/qr', authMiddleware_1.authenticateJWT, memberController_1.getMemberQr);
// Administrative member management routes
router.get('/', authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)([constants_1.ROLES.SUPER_ADMIN, constants_1.ROLES.ADMIN, constants_1.ROLES.DISTRICT_ADMIN, constants_1.ROLES.TALUK_ADMIN, constants_1.ROLES.UNIT_ADMIN]), memberController_1.getMembers);
router.get('/:id', authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)([constants_1.ROLES.SUPER_ADMIN, constants_1.ROLES.ADMIN, constants_1.ROLES.DISTRICT_ADMIN, constants_1.ROLES.TALUK_ADMIN, constants_1.ROLES.UNIT_ADMIN]), memberController_1.getMemberById);
router.patch('/:id/status', authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)([constants_1.ROLES.SUPER_ADMIN, constants_1.ROLES.ADMIN, constants_1.ROLES.DISTRICT_ADMIN, constants_1.ROLES.TALUK_ADMIN]), memberController_1.updateStatus);
exports.default = router;
