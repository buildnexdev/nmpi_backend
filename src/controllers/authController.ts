import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { memberRegisterSchema, loginSchema, changePasswordSchema } from '../validators/authValidator';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    await memberRegisterSchema.validate(req.body, { abortEarly: false });
    const result = await AuthService.registerMember(req.body);
    return sendSuccess(res, result.message, result, 201);
  } catch (err: any) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    await loginSchema.validate(req.body, { abortEarly: false });
    const { login, password } = req.body;
    const result = await AuthService.login(login, password);
    return sendSuccess(res, 'Login successful', result);
  } catch (err: any) {
    return sendError(res, err.message || 'Login failed', 'INVALID_CREDENTIALS', 401);
  }
}

export async function getMe(req: any, res: Response, next: NextFunction) {
  try {
    const session = await AuthService.getSessionUser(Number(req.user?.id));
    if (!session) return sendError(res, 'Account not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Current user retrieved', session);
  } catch (err: any) {
    next(err);
  }
}

export async function changePassword(req: any, res: Response, next: NextFunction) {
  try {
    await changePasswordSchema.validate(req.body, { abortEarly: false });
    const userId = Number(req.user?.id);
    await AuthService.changePassword(userId, req.body.current_password, req.body.new_password);
    return sendSuccess(res, 'Password updated.', { ok: true });
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return sendError(res, err.message || 'Validation error', 'VALIDATION_ERROR', 400);
    }
    const msg = err.message || 'Could not update password';
    const status = /incorrect/i.test(msg) ? 400 : 400;
    return sendError(res, msg, 'VALIDATION_ERROR', status);
  }
}
