import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

export function requireRoles(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const userRoles = req.user.roles || [];
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return sendError(res, 'Access denied: Insufficient role permissions', ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
}

export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const userRoles = req.user.roles || [];
    if (userRoles.includes('SUPER_ADMIN')) {
      return next(); // Super admin bypass
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(permissionCode)) {
      return sendError(res, `Access denied: Missing required permission [${permissionCode}]`, ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
}
