import { Response, NextFunction } from 'express';
import { FeedService } from '../services/feedService';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { CONTENT_ADMIN_ROLES } from '../constants';

export async function listFeed(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Feed retrieved', await FeedService.list(req.query, req.user?.id || null));
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const post = await FeedService.create(req.user!.id, req.user!.member_db_id || null, req.body);
    return sendSuccess(res, 'Post created', post, 201);
  } catch (err) {
    next(err);
  }
}

export async function toggleLike(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Like updated', await FeedService.toggleLike(Number(req.params.id), req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const isAdmin = (req.user?.roles || []).some((r) => CONTENT_ADMIN_ROLES.includes(r));
    await FeedService.remove(Number(req.params.id), req.user!.id, isAdmin);
    return sendSuccess(res, 'Post deleted');
  } catch (err) {
    next(err);
  }
}
