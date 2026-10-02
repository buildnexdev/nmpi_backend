import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { memberRegisterSchema, loginSchema } from '../validators/authValidator';

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
    return sendSuccess(res, 'Current user retrieved', req.user);
  } catch (err: any) {
    next(err);
  }
}
