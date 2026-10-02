import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string;
    const events = await EventService.getEvents(status);
    return sendSuccess(res, 'Events list retrieved', events);
  } catch (err: any) {
    next(err);
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await EventService.getEventById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Event retrieved', event);
  } catch (err: any) {
    next(err);
  }
}

export async function createEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const organizerId = req.user?.id || 1;
    const result = await EventService.createEvent(req.body, organizerId);
    return sendSuccess(res, 'Event created successfully', result, 201);
  } catch (err: any) {
    next(err);
  }
}
