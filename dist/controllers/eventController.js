"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvents = getEvents;
exports.getEventsAdminList = getEventsAdminList;
exports.getEventById = getEventById;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
const eventService_1 = require("../services/eventService");
const response_1 = require("../utils/response");
async function getEvents(req, res, next) {
    try {
        const events = await eventService_1.EventService.getEvents({
            status: req.query.status,
            upcoming: req.query.upcoming === 'true' || req.query.upcoming === '1',
            limit: req.query.limit,
        });
        return (0, response_1.sendSuccess)(res, 'Events list retrieved', events);
    }
    catch (err) {
        next(err);
    }
}
async function getEventsAdminList(req, res, next) {
    try {
        const events = await eventService_1.EventService.getEvents({
            status: req.query.status,
        });
        return (0, response_1.sendSuccess)(res, 'Events list retrieved', events);
    }
    catch (err) {
        next(err);
    }
}
async function getEventById(req, res, next) {
    try {
        const event = await eventService_1.EventService.getEventById(req.params.id);
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
        const organizerId = req.user?.id || 1;
        const result = await eventService_1.EventService.createEvent(req.body, organizerId);
        return (0, response_1.sendSuccess)(res, 'Event created successfully', result, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateEvent(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return (0, response_1.sendError)(res, 'Invalid event id', 'VALIDATION_ERROR', 400);
        const result = await eventService_1.EventService.updateEvent(id, req.body);
        if (!result)
            return (0, response_1.sendError)(res, 'Event not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Event updated', result);
    }
    catch (err) {
        next(err);
    }
}
async function deleteEvent(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return (0, response_1.sendError)(res, 'Invalid event id', 'VALIDATION_ERROR', 400);
        const ok = await eventService_1.EventService.deleteEvent(id);
        if (!ok)
            return (0, response_1.sendError)(res, 'Event not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Event deleted', { id });
    }
    catch (err) {
        next(err);
    }
}
