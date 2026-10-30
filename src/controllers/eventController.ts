import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { EventRsvpService } from '../services/eventRsvpService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Events list retrieved', await EventService.list(req.query, false));
  } catch (err) {
    next(err);
  }
}

export async function rsvpEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const eventId = Number(req.params.id);
    const status = String(req.body.status || 'GOING');
    const rsvp = await EventRsvpService.upsert(eventId, req.user!.id, req.user!.member_db_id || null, status);
    const counts = await EventRsvpService.counts(eventId);
    return sendSuccess(res, 'RSVP saved', { rsvp, counts });
  } catch (err) {
    next(err);
  }
}

export async function checkInEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const eventId = Number(req.params.id);
    const rsvp = await EventRsvpService.checkIn(eventId, req.user!.id);
    const counts = await EventRsvpService.counts(eventId);
    return sendSuccess(res, 'Checked in', { rsvp, counts });
  } catch (err) {
    next(err);
  }
}

export async function myEventRsvp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const eventId = Number(req.params.id);
    const rsvp = await EventRsvpService.getMyRsvp(eventId, req.user!.id);
    const counts = await EventRsvpService.counts(eventId);
    return sendSuccess(res, 'RSVP status', { rsvp, counts });
  } catch (err) {
    next(err);
  }
}

export async function listEventRsvps(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'RSVP list', await EventRsvpService.listForEvent(Number(req.params.id)));
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
