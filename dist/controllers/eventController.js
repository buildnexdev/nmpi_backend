"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
exports.listAllEvents = listAllEvents;
exports.getEvent = getEvent;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
const eventService_1 = require("../services/eventService");
const response_1 = require("../utils/response");
async function listEvents(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Events list retrieved', await eventService_1.EventService.list(req.query, false));
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
