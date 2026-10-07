import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/newsService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function listPublished(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'News list retrieved', await NewsService.list(req.query, false));
  } catch (err) {
    next(err);
  }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'News list retrieved', await NewsService.list(req.query, true));
  } catch (err) {
    next(err);
  }
}

export async function getPublished(req: Request, res: Response, next: NextFunction) {
  try {
    const news = await NewsService.get(req.params.id, false);
    if (!news) return sendError(res, 'News article not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'News article retrieved', news);
  } catch (err) {
    next(err);
  }
}

export async function createNews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'News article published', await NewsService.create(req.body, req.user!.id), 201);
  } catch (err) {
    next(err);
  }
}

export async function updateNews(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'News article updated', await NewsService.update(Number(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteNews(req: Request, res: Response, next: NextFunction) {
  try {
    await NewsService.remove(Number(req.params.id));
    return sendSuccess(res, 'News article deleted');
  } catch (err) {
    next(err);
  }
}
