import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

export function requireRoles(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const hasRole = (req.user.roles || []).some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return sendError(res, 'Access denied: insufficient permissions', ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
}
