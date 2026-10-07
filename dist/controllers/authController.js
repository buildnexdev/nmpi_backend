"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.changePassword = changePassword;
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
const authValidator_1 = require("../validators/authValidator");
async function register(req, res, next) {
    try {
        await authValidator_1.memberRegisterSchema.validate(req.body, { abortEarly: false });
        const result = await authService_1.AuthService.registerMember(req.body);
        return (0, response_1.sendSuccess)(res, result.message, result, 201);
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        await authValidator_1.loginSchema.validate(req.body, { abortEarly: false });
        const { login, password } = req.body;
        const result = await authService_1.AuthService.login(login, password);
        return (0, response_1.sendSuccess)(res, 'Login successful', result);
    }
    catch (err) {
        return (0, response_1.sendError)(res, err.message || 'Login failed', 'INVALID_CREDENTIALS', 401);
    }
}
async function getMe(req, res, next) {
    try {
        const session = await authService_1.AuthService.getSessionUser(Number(req.user?.id));
        if (!session)
            return (0, response_1.sendError)(res, 'Account not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Current user retrieved', session);
    }
    catch (err) {
        next(err);
    }
}
async function changePassword(req, res, next) {
    try {
        await authValidator_1.changePasswordSchema.validate(req.body, { abortEarly: false });
        const userId = Number(req.user?.id);
        await authService_1.AuthService.changePassword(userId, req.body.current_password, req.body.new_password);
        return (0, response_1.sendSuccess)(res, 'Password updated.', { ok: true });
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return (0, response_1.sendError)(res, err.message || 'Validation error', 'VALIDATION_ERROR', 400);
        }
        const msg = err.message || 'Could not update password';
        const status = /incorrect/i.test(msg) ? 400 : 400;
        return (0, response_1.sendError)(res, msg, 'VALIDATION_ERROR', status);
    }
}
