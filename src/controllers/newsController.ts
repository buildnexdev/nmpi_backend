import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/newsService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function getNewsList(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as string || 'PUBLISHED',
      is_featured: req.query.is_featured === 'true',
      category_id: req.query.category_id,
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
