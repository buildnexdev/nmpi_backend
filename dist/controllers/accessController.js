"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessMatrix = getAccessMatrix;
exports.saveAccessMatrix = saveAccessMatrix;
exports.getMyAccess = getMyAccess;
const accessService_1 = require("../services/accessService");
const response_1 = require("../utils/response");
const roles_1 = require("../utils/roles");
async function getAccessMatrix(req, res, next) {
    try {
        const data = await accessService_1.AccessService.getMatrix();
        return (0, response_1.sendSuccess)(res, 'Role access matrix retrieved', data);
    }
    catch (err) {
        next(err);
    }
}
async function saveAccessMatrix(req, res, next) {
    try {
        if (!(0, roles_1.isPortalAdmin)(req.user?.roles)) {
            return (0, response_1.sendError)(res, 'Only Admin and Super Admin can change role access.', 'FORBIDDEN', 403);
        }
        const items = Array.isArray(req.body?.items) ? req.body.items : req.body?.roles;
        if (!Array.isArray(items) || items.length === 0) {
            return (0, response_1.sendError)(res, 'Provide at least one role access row to save.', 'VALIDATION_ERROR', 400);
        }
        const data = await accessService_1.AccessService.saveMatrix(items, req.user?.roles || []);
        return (0, response_1.sendSuccess)(res, 'Role access updated', data);
    }
    catch (err) {
        if (err.status === 403)
            return (0, response_1.sendError)(res, err.message, 'FORBIDDEN', 403);
        next(err);
    }
}
async function getMyAccess(_req, res, next) {
    try {
        next();
    }
    catch (err) {
        next(err);
    }
}
