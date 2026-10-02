import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(res: Response, message: string, data: T = null as any, statusCode = 200): Response {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(payload);
}

export function sendError(res: Response, message: string, code = 'ERROR', statusCode = 400, details: any = null): Response {
  const payload: ApiResponse = {
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
