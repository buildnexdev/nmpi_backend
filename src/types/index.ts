import { Request } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  roles: string[];
  member_db_id: number | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error?: {
    code: string;
    details?: any;
  } | null;
}

export class HttpError extends Error {
  status: number;
  code: string;
  details: any;

  constructor(status: number, message: string, code = 'ERROR', details: any = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
