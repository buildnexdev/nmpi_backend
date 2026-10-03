import { Request, Response, NextFunction } from 'express';
import * as yup from 'yup';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

const loginSchema = yup.object({
  login: yup.string().trim().required('Email or phone number is required'),
  password: yup.string().required('Password is required'),
});

const changePasswordSchema = yup.object({
  current_password: yup.string().required('Current password is required'),
  new_password: yup.string().min(8, 'New password must be at least 8 characters').required('New password is required'),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { login, password } = await loginSchema.validate(req.body, { abortEarly: true });
    const result = await AuthService.login(login, password);
    return sendSuccess(res, 'Login successful', result);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await AuthService.getSessionUser(req.user!.id);
    if (!user) return sendError(res, 'User not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Current user retrieved', user);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = await changePasswordSchema.validate(req.body, { abortEarly: true });
    await AuthService.changePassword(req.user!.id, body.current_password, body.new_password);
    return sendSuccess(res, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
}
