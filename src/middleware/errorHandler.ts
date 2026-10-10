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

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return sendError(res, 'One of the selected location or role values is invalid.', ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
  }

  if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_COLUMN' || err.code === 'WARN_DATA_TRUNCATED' || err.code === 'ER_DATA_TOO_LONG') {
    return sendError(res, err.sqlMessage || 'One of the submitted values is invalid.', ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST);
  }

  console.error('Unhandled server error:', err);
  const reason = err.sqlMessage || err.message || 'An unexpected internal server error occurred';
  return sendError(res, reason, ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER, {
    code: err.code || err.name || null,
  });
}
