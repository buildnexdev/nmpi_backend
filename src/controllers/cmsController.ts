import { Request, Response, NextFunction } from 'express';
import { CmsService } from '../services/cmsService';
import { DashboardService } from '../services/dashboardService';
import { sendSuccess, sendError } from '../utils/response';

export async function getPublicStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await DashboardService.getPublicStats();
    return sendSuccess(res, 'Public statistics retrieved', stats);
  } catch (err: any) {
    next(err);
  }
}

export async function getLeaders(_req: Request, res: Response, next: NextFunction) {
  try {
    const leaders = await CmsService.getLeaders();
    return sendSuccess(res, 'Leadership list retrieved', leaders);
  } catch (err: any) {
    next(err);
  }
}

export async function getLeadersAdmin(_req: Request, res: Response, next: NextFunction) {
  try {
    const leaders = await CmsService.getLeadersAdmin();
    return sendSuccess(res, 'Leadership list retrieved', leaders);
  } catch (err: any) {
    next(err);
  }
}

export async function createLeader(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.body?.name || !req.body?.designation) {
      return sendError(res, 'Name and designation are required', 'VALIDATION_ERROR', 400);
    }
    const leader = await CmsService.createLeader(req.body);
    return sendSuccess(res, 'Leader created', leader, 201);
  } catch (err: any) {
    next(err);
  }
}

export async function updateLeader(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Invalid leader id', 'VALIDATION_ERROR', 400);
    const leader = await CmsService.updateLeader(id, req.body);
    if (!leader) return sendError(res, 'Leader not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Leader updated', leader);
  } catch (err: any) {
    next(err);
  }
}

export async function deleteLeader(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Invalid leader id', 'VALIDATION_ERROR', 400);
    const ok = await CmsService.deleteLeader(id);
    if (!ok) return sendError(res, 'Leader not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Leader deleted', { id });
  } catch (err: any) {
    next(err);
  }
}

export async function getPages(_req: Request, res: Response, next: NextFunction) {
  try {
    const pages = await CmsService.getPages();
    return sendSuccess(res, 'Pages retrieved', pages);
  } catch (err: any) {
    next(err);
  }
}

export async function getPage(req: Request, res: Response, next: NextFunction) {
  try {
    const page = await CmsService.getPage(req.params.key);
    if (!page) return sendError(res, 'Page content not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Page content retrieved', page);
  } catch (err: any) {
    next(err);
  }
}

export async function updatePage(req: Request, res: Response, next: NextFunction) {
  try {
    const page = await CmsService.upsertPage(req.params.key, req.body);
    return sendSuccess(res, 'Page saved', page);
  } catch (err: any) {
    if (err.status === 400) return sendError(res, err.message, 'VALIDATION_ERROR', 400);
    next(err);
  }
}

export async function getGalleryAlbums(_req: Request, res: Response, next: NextFunction) {
  try {
    const albums = await CmsService.getGalleryAlbums();
    return sendSuccess(res, 'Gallery albums retrieved', albums);
  } catch (err: any) {
    next(err);
  }
}

export async function getGeography(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await CmsService.getGeography();
    return sendSuccess(res, 'Geography data retrieved', data);
  } catch (err: any) {
    next(err);
  }
}
