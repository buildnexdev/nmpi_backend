"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
exports.requirePermission = requirePermission;
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
function requireRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required', constants_1.ERROR_CODES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const userRoles = req.user.roles || [];
        const hasRole = userRoles.some((role) => allowedRoles.includes(role));
        if (!hasRole) {
            return (0, response_1.sendError)(res, 'Access denied: Insufficient role permissions', constants_1.ERROR_CODES.FORBIDDEN, constants_1.HTTP_STATUS.FORBIDDEN);
        }
        next();
    };
}
function requirePermission(permissionCode) {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Authentication required', constants_1.ERROR_CODES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const userRoles = req.user.roles || [];
        if (userRoles.includes('SUPER_ADMIN')) {
            return next(); // Super admin bypass
        }
        const userPermissions = req.user.permissions || [];
        if (!userPermissions.includes(permissionCode)) {
            return (0, response_1.sendError)(res, `Access denied: Missing required permission [${permissionCode}]`, constants_1.ERROR_CODES.FORBIDDEN, constants_1.HTTP_STATUS.FORBIDDEN);
        }
        next();
    };
}
