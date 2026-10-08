"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getMe = getMe;
exports.changePassword = changePassword;
const yup = __importStar(require("yup"));
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
const loginSchema = yup.object({
    login: yup.string().trim().required('Email or phone number is required'),
    password: yup.string().required('Password is required'),
});
const changePasswordSchema = yup.object({
    current_password: yup.string().required('Current password is required'),
    new_password: yup.string().min(8, 'New password must be at least 8 characters').required('New password is required'),
});
async function login(req, res, next) {
    try {
        const { login, password } = await loginSchema.validate(req.body, { abortEarly: true });
        const result = await authService_1.AuthService.login(login, password);
        return (0, response_1.sendSuccess)(res, 'Login successful', result);
    }
    catch (err) {
        next(err);
    }
}
async function getMe(req, res, next) {
    try {
        const user = await authService_1.AuthService.getSessionUser(Number(req.user?.id));
        if (!user)
            return (0, response_1.sendError)(res, 'User not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Current user retrieved', user);
    }
    catch (err) {
        next(err);
    }
}
async function changePassword(req, res, next) {
    try {
        const body = await changePasswordSchema.validate(req.body, { abortEarly: true });
        await authService_1.AuthService.changePassword(Number(req.user.id), body.current_password, body.new_password);
        return (0, response_1.sendSuccess)(res, 'Password updated successfully');
    }
    catch (err) {
        next(err);
    }
}
