import { Request, Response, NextFunction } from 'express';
import { VerificationService } from '../services/verificationService';
import { sendSuccess, sendError } from '../utils/response';

export async function verifyMemberToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    if (!token) {
      return sendError(res, 'Verification token parameter is missing', 'VALIDATION_ERROR', 400);
    }
    const result = await VerificationService.verifyToken(token);
    if (!result.verified) {
      return sendError(res, result.message, 'VERIFICATION_FAILED', 404);
    }
    return sendSuccess(res, result.message, result.member);
  } catch (err: any) {
    next(err);
  }
}
