import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await EventService.getEvents({
      status: req.query.status as string,
      upcoming: req.query.upcoming === 'true' || req.query.upcoming === '1',
      limit: req.query.limit,
    });
    return sendSuccess(res, 'Events list retrieved', events);
  } catch (err: any) {
    next(err);
  }
}

export async function getEventsAdminList(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await EventService.getEvents({
      status: req.query.status as string,
    });
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

export async function updateEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Invalid event id', 'VALIDATION_ERROR', 400);
    const result = await EventService.updateEvent(id, req.body);
    if (!result) return sendError(res, 'Event not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Event updated', result);
  } catch (err: any) {
    next(err);
  }
}

export async function deleteEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Invalid event id', 'VALIDATION_ERROR', 400);
    const ok = await EventService.deleteEvent(id);
    if (!ok) return sendError(res, 'Event not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Event deleted', { id });
  } catch (err: any) {
    next(err);
  }
}
