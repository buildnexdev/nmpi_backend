import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token required', ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_community_platform';

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      mobile: decoded.mobile,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      member_id: decoded.member_id || null,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session token expired, please log in again', ERROR_CODES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
    }
    return sendError(res, 'Invalid authorization token', ERROR_CODES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }
}
