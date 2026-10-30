import { Response, NextFunction } from 'express';
import { ReelService } from '../services/reelService';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export async function listReels(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Reels retrieved', await ReelService.list(req.query, req.user?.id || null));
  } catch (err) {
    next(err);
  }
}

export async function createReel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Reel created', await ReelService.create(req.user!.id, req.body), 201);
  } catch (err) {
    next(err);
  }
}

export async function viewReel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await ReelService.recordView(Number(req.params.id));
    return sendSuccess(res, 'View recorded');
  } catch (err) {
    next(err);
  }
}

export async function toggleReelLike(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Like updated', await ReelService.toggleLike(Number(req.params.id), req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function deleteReel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await ReelService.remove(Number(req.params.id));
    return sendSuccess(res, 'Reel deleted');
  } catch (err) {
    next(err);
  }
}
