import { Request, Response, NextFunction } from 'express';
import { CmsService } from '../services/cmsService';
import { sendSuccess, sendError } from '../utils/response';

export async function getLeaders(req: Request, res: Response, next: NextFunction) {
  try {
    const leaders = await CmsService.getLeaders();
    return sendSuccess(res, 'Leadership list retrieved', leaders);
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

export async function getGalleryAlbums(req: Request, res: Response, next: NextFunction) {
  try {
    const albums = await CmsService.getGalleryAlbums();
    return sendSuccess(res, 'Gallery albums retrieved', albums);
  } catch (err: any) {
    next(err);
  }
}

export async function getGeography(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await CmsService.getGeography();
    return sendSuccess(res, 'Geography data retrieved', data);
  } catch (err: any) {
    next(err);
  }
}
