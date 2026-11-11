"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
exports.rsvpEvent = rsvpEvent;
exports.checkInEvent = checkInEvent;
exports.myEventRsvp = myEventRsvp;
exports.listEventRsvps = listEventRsvps;
exports.listAllEvents = listAllEvents;
exports.getEvent = getEvent;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
const eventService_1 = require("../services/eventService");
const eventRsvpService_1 = require("../services/eventRsvpService");
const response_1 = require("../utils/response");
async function listEvents(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Events list retrieved', await eventService_1.EventService.list(req.query, false));
    }
    catch (err) {
        next(err);
    }
}
async function rsvpEvent(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const status = String(req.body.status || 'GOING');
        const rsvp = await eventRsvpService_1.EventRsvpService.upsert(eventId, req.user.id, req.user.member_db_id || null, status);
        const counts = await eventRsvpService_1.EventRsvpService.counts(eventId);
        return (0, response_1.sendSuccess)(res, 'RSVP saved', { rsvp, counts });
    }
    catch (err) {
        next(err);
    }
}
async function checkInEvent(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const rsvp = await eventRsvpService_1.EventRsvpService.checkIn(eventId, req.user.id);
        const counts = await eventRsvpService_1.EventRsvpService.counts(eventId);
        return (0, response_1.sendSuccess)(res, 'Checked in', { rsvp, counts });
    }
    catch (err) {
        next(err);
    }
}
async function myEventRsvp(req, res, next) {
    try {
        const eventId = Number(req.params.id);
        const rsvp = await eventRsvpService_1.EventRsvpService.getMyRsvp(eventId, req.user.id);
        const counts = await eventRsvpService_1.EventRsvpService.counts(eventId);
        return (0, response_1.sendSuccess)(res, 'RSVP status', { rsvp, counts });
    }
    catch (err) {
        next(err);
    }
}
async function listEventRsvps(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'RSVP list', await eventRsvpService_1.EventRsvpService.listForEvent(Number(req.params.id)));
    }
    catch (err) {
        next(err);
    }
}
async function listAllEvents(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Events list retrieved', await eventService_1.EventService.list(req.query, true));
    }
    catch (err) {
        next(err);
    }
}
async function getEvent(req, res, next) {
    try {
        const event = await eventService_1.EventService.get(req.params.id);
        if (!event)
            return (0, response_1.sendError)(res, 'Event not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Event retrieved', event);
    }
    catch (err) {
        next(err);
    }
}
async function createEvent(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Event created', await eventService_1.EventService.create(req.body, req.user.id), 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateEvent(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Event updated', await eventService_1.EventService.update(Number(req.params.id), req.body));
    }
    catch (err) {
        next(err);
    }
}
async function deleteEvent(req, res, next) {
    try {
        await eventService_1.EventService.remove(Number(req.params.id));
        return (0, response_1.sendSuccess)(res, 'Event deleted');
    }
    catch (err) {
        next(err);
    }
}
