"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const multer_1 = __importDefault(require("multer"));
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
const types_1 = require("../types");
function errorHandler(err, req, res, next) {
    if (err instanceof types_1.HttpError) {
        return (0, response_1.sendError)(res, err.message, err.code, err.status, err.details);
    }
    if (err.name === 'ValidationError') {
        return (0, response_1.sendError)(res, err.errors?.[0] || err.message || 'Validation error', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, err.errors);
    }
    if (err instanceof multer_1.default.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds the 5MB limit' : err.message;
        return (0, response_1.sendError)(res, message, constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
    if (err.code === 'INVALID_FILE_TYPE') {
        return (0, response_1.sendError)(res, err.message, constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
    if (err.code === 'ER_DUP_ENTRY') {
        return (0, response_1.sendError)(res, 'A record with these details already exists.', constants_1.ERROR_CODES.DUPLICATE_ENTRY, constants_1.HTTP_STATUS.CONFLICT);
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return (0, response_1.sendError)(res, 'One of the selected location or role values is invalid.', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
    if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_COLUMN' || err.code === 'WARN_DATA_TRUNCATED' || err.code === 'ER_DATA_TOO_LONG') {
        return (0, response_1.sendError)(res, err.sqlMessage || 'One of the submitted values is invalid.', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST);
    }
    console.error('Unhandled server error:', err);
    const reason = err.sqlMessage || err.message || 'An unexpected internal server error occurred';
    return (0, response_1.sendError)(res, reason, constants_1.ERROR_CODES.INTERNAL_ERROR, constants_1.HTTP_STATUS.INTERNAL_SERVER, {
        code: err.code || err.name || null,
    });
}
