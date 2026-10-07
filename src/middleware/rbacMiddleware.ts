import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { ERROR_CODES, HTTP_STATUS } from '../constants';
import { isSuperAdmin, normalizeRoleCodes } from '../utils/roles';
import { AccessService } from '../services/accessService';

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

export function requirePage(pageKey: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }
      if (pageKey === 'account' || isSuperAdmin(req.user.roles)) {
        return next();
      }
      const pages = await AccessService.getPagesForRoleNames(req.user.roles || []);
      if (!pages.includes(pageKey)) {
        return sendError(res, 'Access denied: this page is not granted to your role', ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
