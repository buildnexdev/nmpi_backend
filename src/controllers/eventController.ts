import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Events list retrieved', await EventService.list(req.query, false));
  } catch (err) {
    next(err);
  }
}

export async function listAllEvents(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Events list retrieved', await EventService.list(req.query, true));
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await EventService.get(req.params.id);
    if (!event) return sendError(res, 'Event not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Event retrieved', event);
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Event created', await EventService.create(req.body, req.user!.id), 201);
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Event updated', await EventService.update(Number(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    await EventService.remove(Number(req.params.id));
    return sendSuccess(res, 'Event deleted');
  } catch (err) {
    next(err);
  }
}
