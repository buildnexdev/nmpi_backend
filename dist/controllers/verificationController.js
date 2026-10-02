"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMemberToken = verifyMemberToken;
const verificationService_1 = require("../services/verificationService");
const response_1 = require("../utils/response");
async function verifyMemberToken(req, res, next) {
    try {
        const { token } = req.params;
        if (!token) {
            return (0, response_1.sendError)(res, 'Verification token parameter is missing', 'VALIDATION_ERROR', 400);
        }
        const result = await verificationService_1.VerificationService.verifyToken(token);
        if (!result.verified) {
            return (0, response_1.sendError)(res, result.message, 'VERIFICATION_FAILED', 404);
        }
        return (0, response_1.sendSuccess)(res, result.message, result.member);
    }
    catch (err) {
        next(err);
    }
}
