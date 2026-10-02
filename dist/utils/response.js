"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, message, data = null, statusCode = 200) {
    const payload = {
        success: true,
        message,
        data,
        error: null,
    };
    return res.status(statusCode).json(payload);
}
function sendError(res, message, code = 'ERROR', statusCode = 400, details = null) {
    const payload = {
        success: false,
        message,
        data: null,
        error: {
            code,
            details,
        },
    };
    return res.status(statusCode).json(payload);
}
