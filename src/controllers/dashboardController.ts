import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { MemberService } from '../services/memberService';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const scope = await MemberService.getStaffScope(req.user!);
    const stats = await DashboardService.getStatistics(scope);
    return sendSuccess(res, 'Dashboard statistics calculated', stats);
  } catch (err) {
    next(err);
  }
}
