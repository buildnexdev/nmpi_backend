"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
exports.requirePage = requirePage;
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const roles_1 = require("../utils/roles");
const accessService_1 = require("../services/accessService");
function requireRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required', constants_1.ERROR_CODES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const hasRole = (req.user.roles || []).some((role) => allowedRoles.includes(role));
        if (!hasRole) {
            return (0, response_1.sendError)(res, 'Access denied: insufficient permissions', constants_1.ERROR_CODES.FORBIDDEN, constants_1.HTTP_STATUS.FORBIDDEN);
        }
        next();
    };
}
function requirePage(pageKey) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, 'Authentication required', constants_1.ERROR_CODES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
            }
            if (pageKey === 'account' || (0, roles_1.isSuperAdmin)(req.user.roles)) {
                return next();
            }
            const pages = await accessService_1.AccessService.getPagesForRoleNames(req.user.roles || []);
            if (!pages.includes(pageKey)) {
                return (0, response_1.sendError)(res, 'Access denied: this page is not granted to your role', constants_1.ERROR_CODES.FORBIDDEN, constants_1.HTTP_STATUS.FORBIDDEN);
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
