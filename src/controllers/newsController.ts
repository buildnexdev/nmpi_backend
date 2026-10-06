import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/newsService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function getNewsList(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as string || 'PUBLISHED',
      is_featured: req.query.is_featured === undefined ? undefined : req.query.is_featured === 'true',
      category: req.query.category as string,
      search: req.query.search as string,
      limit: req.query.limit,
    };
    const news = await NewsService.getNewsList(filters);
    return sendSuccess(res, 'News list retrieved', news);
  } catch (err: any) {
    next(err);
  }
}

export async function getNewsAdminList(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as string || undefined,
      search: req.query.search as string,
    };
    const news = await NewsService.getNewsList(filters);
    return sendSuccess(res, 'News list retrieved', news);
  } catch (err: any) {
    next(err);
  }
}

export async function getNewsById(req: Request, res: Response, next: NextFunction) {
  try {
    const news = await NewsService.getNewsById(req.params.id);
    if (!news) return sendError(res, 'News article not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'News article retrieved', news);
  } catch (err: any) {
    next(err);
  }
}

export async function createNews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authorId = req.user?.id || 1;
    const result = await NewsService.createNews(req.body, authorId);
    return sendSuccess(res, 'News article created successfully', result, 201);
  } catch (err: any) {
    next(err);
  }
}

export async function updateNews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Invalid news id', 'VALIDATION_ERROR', 400);
    const result = await NewsService.updateNews(id, req.body);
    if (!result) return sendError(res, 'News article not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'News article updated', result);
  } catch (err: any) {
    next(err);
  }
}

export async function deleteNews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Invalid news id', 'VALIDATION_ERROR', 400);
    const ok = await NewsService.deleteNews(id);
    if (!ok) return sendError(res, 'News article not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'News article deleted', { id });
  } catch (err: any) {
    next(err);
  }
}
