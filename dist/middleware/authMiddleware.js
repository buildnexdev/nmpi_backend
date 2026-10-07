"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const roles_1 = require("../utils/roles");
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return (0, response_1.sendError)(res, 'Authorization token required', constants_1.ERROR_CODES.UNAUTHORIZED, constants_1.HTTP_STATUS.UNAUTHORIZED);
    }
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_community_platform';
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            mobile: decoded.mobile,
            roles: (0, roles_1.normalizeRoleCodes)(decoded.roles || []),
            permissions: decoded.permissions || [],
            member_id: decoded.member_id || null,
        };
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return (0, response_1.sendError)(res, 'Session token expired, please log in again', constants_1.ERROR_CODES.TOKEN_EXPIRED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
        return (0, response_1.sendError)(res, 'Invalid authorization token', constants_1.ERROR_CODES.INVALID_TOKEN, constants_1.HTTP_STATUS.UNAUTHORIZED);
    }
}
