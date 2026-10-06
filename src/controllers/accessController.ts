import { Request, Response, NextFunction } from 'express';
import { AccessService } from '../services/accessService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';
import { isPortalAdmin } from '../utils/roles';

export async function getAccessMatrix(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AccessService.getMatrix();
    return sendSuccess(res, 'Role access matrix retrieved', data);
  } catch (err) {
    next(err);
  }
}

export async function saveAccessMatrix(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!isPortalAdmin(req.user?.roles)) {
      return sendError(res, 'Only Admin and Super Admin can change role access.', 'FORBIDDEN', 403);
    }
    const items = Array.isArray(req.body?.items) ? req.body.items : req.body?.roles;
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Provide at least one role access row to save.', 'VALIDATION_ERROR', 400);
    }
    const data = await AccessService.saveMatrix(items, req.user?.roles || []);
    return sendSuccess(res, 'Role access updated', data);
  } catch (err: any) {
    if (err.status === 403) return sendError(res, err.message, 'FORBIDDEN', 403);
    next(err);
  }
}

export async function getMyAccess(_req: Request, res: Response, next: NextFunction) {
  try {
    next();
  } catch (err) {
    next(err);
  }
}
