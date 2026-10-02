import { Response, NextFunction } from 'express';
import { MemberService } from '../services/memberService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function getMembers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as string,
      district_id: req.query.district_id,
      taluk_id: req.query.taluk_id,
      unit_id: req.query.unit_id,
      search: req.query.search as string,
    };
    const members = await MemberService.getMembers(filters);
    return sendSuccess(res, 'Members retrieved successfully', members);
  } catch (err: any) {
    next(err);
  }
}

export async function getMemberById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const member = await MemberService.getMemberById(id);
    if (!member) {
      return sendError(res, 'Member not found', 'NOT_FOUND', 404);
    }
    return sendSuccess(res, 'Member retrieved successfully', member);
  } catch (err: any) {
    next(err);
  }
}

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
    const member = await MemberService.getMemberById(req.user.id);
    return sendSuccess(res, 'My profile retrieved', member);
  } catch (err: any) {
    next(err);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'Status is required', 'VALIDATION_ERROR', 400);
    }
    const result = await MemberService.updateStatus(id, status, req.user?.id);
    return sendSuccess(res, `Member status updated to ${status}`, result);
  } catch (err: any) {
    next(err);
  }
}

export async function getMemberQr(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const qrData = await MemberService.getMemberQr(id);
    if (!qrData) {
      return sendError(res, 'QR identity record not found for member', 'NOT_FOUND', 404);
    }
    return sendSuccess(res, 'Member QR identity retrieved', qrData);
  } catch (err: any) {
    next(err);
  }
}
