"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requestController_1 = require("../controllers/requestController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const constants_1 = require("../constants");
const router = (0, express_1.Router)();
const admins = [authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)(constants_1.CONTENT_ADMIN_ROLES)];
// Public / Member can submit a request
router.post('/', authMiddleware_1.optionalAuthenticateJWT, requestController_1.submitRequest);
// Public / Member can track by unique ref number (e.g. NMPI-2026-001234)
router.get('/track/:refNo', requestController_1.trackRequest);
// Logged-in member can list their submitted requests
router.get('/my', authMiddleware_1.optionalAuthenticateJWT, requestController_1.listMyRequests);
// Admin endpoints for backoffice / web application
router.get('/admin/list', ...admins, requestController_1.listAllRequests);
router.patch('/admin/:id/status', ...admins, requestController_1.updateRequestStatus);
exports.default = router;
