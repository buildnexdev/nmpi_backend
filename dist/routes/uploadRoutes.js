"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const roles_1 = require("../utils/roles");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const staff = [authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)([...roles_1.STAFF_ROLE_CODES])];
router.get('/list', uploadController_1.listUploads);
router.post('/', authMiddleware_1.authenticateJWT, (0, rbacMiddleware_1.requireRoles)([...roles_1.STAFF_ROLE_CODES]), (req, res, next) => {
    const isVideo = (0, uploadMiddleware_1.resolveMediaFolder)(req.query.folder) === uploadMiddleware_1.VIDEO_MEDIA_FOLDER;
    const uploader = isVideo ? uploadMiddleware_1.uploadMediaVideo : uploadMiddleware_1.uploadMediaImage;
    uploader.single('file')(req, res, (err) => {
        if (err)
            return (0, response_1.sendError)(res, err.message || 'Upload failed', 'VALIDATION_ERROR', 400);
        next();
    });
}, uploadController_1.createUpload);
router.delete('/:filename', ...staff, uploadController_1.deleteUpload);
exports.default = router;
