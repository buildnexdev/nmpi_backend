"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
function errorHandler(err, req, res, next) {
    console.error('🔥 Centralized Server Error:', err);
    if (err.name === 'ValidationError') {
        return (0, response_1.sendError)(res, err.message || 'Validation error', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, err.errors);
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return (0, response_1.sendError)(res, 'File size exceeds maximum allowed limit (5MB)', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
    const message = err.message || 'An unexpected internal server error occurred';
    return (0, response_1.sendError)(res, message, constants_1.ERROR_CODES.INTERNAL_ERROR, constants_1.HTTP_STATUS.INTERNAL_SERVER);
}
