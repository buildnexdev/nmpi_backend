import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('🔥 Centralized Server Error:', err);

  if (err.name === 'ValidationError') {
    return sendError(res, err.message || 'Validation error', ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, err.errors);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'File size exceeds maximum allowed limit (5MB)', ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
  }

  const message = err.message || 'An unexpected internal server error occurred';
  return sendError(res, message, ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER);
}
