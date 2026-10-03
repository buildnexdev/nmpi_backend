import { Request, Response, NextFunction } from 'express';
import { CmsService } from '../services/cmsService';
import { sendSuccess, sendError } from '../utils/response';

function baseUrl(req: Request): string {
  return process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
}

export async function getPublicStats(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Public statistics retrieved', await CmsService.getPublicStats());
  } catch (err) {
    next(err);
  }
}

export async function listLeaders(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Leadership list retrieved', await CmsService.listLeaders(false));
  } catch (err) {
    next(err);
  }
}

export async function listAllLeaders(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Leadership list retrieved', await CmsService.listLeaders(true));
  } catch (err) {
    next(err);
  }
}

export async function createLeader(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Leader added', await CmsService.saveLeader(req.body), 201);
  } catch (err) {
    next(err);
  }
}

export async function updateLeader(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Leader updated', await CmsService.saveLeader(req.body, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function deleteLeader(req: Request, res: Response, next: NextFunction) {
  try {
    await CmsService.deleteLeader(Number(req.params.id));
    return sendSuccess(res, 'Leader removed');
  } catch (err) {
    next(err);
  }
}

export async function listPages(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Pages retrieved', await CmsService.listPages());
  } catch (err) {
    next(err);
  }
}

export async function getPage(req: Request, res: Response, next: NextFunction) {
  try {
    const page = await CmsService.getPage(req.params.key);
    if (!page) return sendError(res, 'Page content not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Page content retrieved', page);
  } catch (err) {
    next(err);
  }
}

export async function savePage(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Page content saved', await CmsService.savePage(req.params.key, req.body));
  } catch (err) {
    next(err);
  }
}

export async function listUploads(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Uploads retrieved', CmsService.listUploads(baseUrl(req)));
  } catch (err) {
    next(err);
  }
}

export async function uploadMedia(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return sendError(res, 'Please choose an image to upload', 'VALIDATION_ERROR', 400);
    const filePath = `/uploads/${encodeURIComponent(req.file.filename)}`;
    return sendSuccess(res, 'Image uploaded', { filename: req.file.filename, path: filePath, url: `${baseUrl(req)}${filePath}` }, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteUpload(req: Request, res: Response, next: NextFunction) {
  try {
    CmsService.deleteUpload(req.params.filename);
    return sendSuccess(res, 'File deleted');
  } catch (err) {
    next(err);
  }
}
