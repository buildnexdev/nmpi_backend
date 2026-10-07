import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { sendError } from '../utils/response';
import { ERROR_CODES, HTTP_STATUS } from '../constants';
import { HttpError } from '../types';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return sendError(res, err.message, err.code, err.status, err.details);
  }

  if (err.name === 'ValidationError') {
    return sendError(res, err.errors?.[0] || err.message || 'Validation error', ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, err.errors);
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds the 5MB limit' : err.message;
    return sendError(res, message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    return sendError(res, err.message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'A record with these details already exists.', ERROR_CODES.DUPLICATE_ENTRY, HTTP_STATUS.CONFLICT);
  }

  console.error('Unhandled server error:', err);
  return sendError(res, 'An unexpected internal server error occurred', ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER);
}
