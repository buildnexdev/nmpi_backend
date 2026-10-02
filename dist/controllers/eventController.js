"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvents = getEvents;
exports.getEventById = getEventById;
exports.createEvent = createEvent;
const eventService_1 = require("../services/eventService");
const response_1 = require("../utils/response");
async function getEvents(req, res, next) {
    try {
        const status = req.query.status;
        const events = await eventService_1.EventService.getEvents(status);
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
