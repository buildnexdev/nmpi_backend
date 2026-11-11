import { Request, Response, NextFunction } from 'express';
import * as yup from 'yup';
import { RequestService } from '../services/requestService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

const createRequestSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  mobile: yup.string().trim().min(10, 'Valid mobile number required').required('Mobile number is required'),
  district_id: yup.number().nullable().optional(),
  district_name: yup.string().nullable().optional(),
  category: yup.string().trim().required('Request category is required'),
  description: yup.string().trim().min(5, 'Please provide description').required('Description is required'),
  attachment_url: yup.string().nullable().optional(),
});

export async function submitRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const validated = await createRequestSchema.validate(req.body, { abortEarly: true });
    const userId = req.user?.id ? Number(req.user.id) : null;
    const result = await RequestService.createRequest({
      ...validated,
      user_id: userId,
    });
    return sendSuccess(res, 'Public service request submitted successfully', result, 201);
  } catch (err) {
    next(err);
  }
}

export async function trackRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const refNo = String(req.params.refNo || '').trim();
    const result = await RequestService.trackRequest(refNo);
    return sendSuccess(res, 'Request tracking information retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function listMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const mobile = req.query.mobile ? String(req.query.mobile).trim() : (req.user as any)?.mobile;
    const result = await RequestService.listUserRequests(userId, mobile);
    return sendSuccess(res, 'My requests retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function listAllRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search, page, limit } = req.query;
    const result = await RequestService.listAllRequests({
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return sendSuccess(res, 'All service requests retrieved', result);
  } catch (err) {
    next(err);
  }
}

export async function updateRequestStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body;
    if (!status) return sendError(res, 'Status is required', 'VALIDATION_ERROR', 400);

    const result = await RequestService.updateStatus(id, status, notes);
    return sendSuccess(res, 'Request status updated successfully', result);
  } catch (err) {
    next(err);
  }
}
