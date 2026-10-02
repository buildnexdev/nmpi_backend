"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
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
        return (0, response_1.sendSuccess)(res, 'Current user retrieved', req.user);
    }
    catch (err) {
        next(err);
    }
}
