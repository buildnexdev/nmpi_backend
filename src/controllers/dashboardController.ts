import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { sendSuccess } from '../utils/response';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await DashboardService.getStatistics();
    return sendSuccess(res, 'Dashboard statistics calculated', stats);
  } catch (err: any) {
    next(err);
  }
}
