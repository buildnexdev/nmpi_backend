"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStats = getPublicStats;
exports.getLeaders = getLeaders;
exports.getLeadersAdmin = getLeadersAdmin;
exports.createLeader = createLeader;
exports.updateLeader = updateLeader;
exports.deleteLeader = deleteLeader;
exports.getPages = getPages;
exports.getPage = getPage;
exports.updatePage = updatePage;
exports.getGalleryAlbums = getGalleryAlbums;
exports.getGeography = getGeography;
const cmsService_1 = require("../services/cmsService");
const dashboardService_1 = require("../services/dashboardService");
const response_1 = require("../utils/response");
async function getPublicStats(_req, res, next) {
    try {
        const stats = await dashboardService_1.DashboardService.getPublicStats();
        return (0, response_1.sendSuccess)(res, 'Public statistics retrieved', stats);
    }
    catch (err) {
        next(err);
    }
}
async function getLeaders(_req, res, next) {
    try {
        const leaders = await cmsService_1.CmsService.getLeaders();
        return (0, response_1.sendSuccess)(res, 'Leadership list retrieved', leaders);
    }
    catch (err) {
        next(err);
    }
}
async function getLeadersAdmin(_req, res, next) {
    try {
        const leaders = await cmsService_1.CmsService.getLeadersAdmin();
        return (0, response_1.sendSuccess)(res, 'Leadership list retrieved', leaders);
    }
    catch (err) {
        next(err);
    }
}
async function createLeader(req, res, next) {
    try {
        if (!req.body?.name || !req.body?.designation) {
            return (0, response_1.sendError)(res, 'Name and designation are required', 'VALIDATION_ERROR', 400);
        }
        const leader = await cmsService_1.CmsService.createLeader(req.body);
        return (0, response_1.sendSuccess)(res, 'Leader created', leader, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateLeader(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return (0, response_1.sendError)(res, 'Invalid leader id', 'VALIDATION_ERROR', 400);
        const leader = await cmsService_1.CmsService.updateLeader(id, req.body);
        if (!leader)
            return (0, response_1.sendError)(res, 'Leader not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Leader updated', leader);
    }
    catch (err) {
        next(err);
    }
}
async function deleteLeader(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return (0, response_1.sendError)(res, 'Invalid leader id', 'VALIDATION_ERROR', 400);
        const ok = await cmsService_1.CmsService.deleteLeader(id);
        if (!ok)
            return (0, response_1.sendError)(res, 'Leader not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Leader deleted', { id });
    }
    catch (err) {
        next(err);
    }
}
async function getPages(_req, res, next) {
    try {
        const pages = await cmsService_1.CmsService.getPages();
        return (0, response_1.sendSuccess)(res, 'Pages retrieved', pages);
    }
    catch (err) {
        next(err);
    }
}
async function getPage(req, res, next) {
    try {
        const page = await cmsService_1.CmsService.getPage(req.params.key);
        if (!page)
            return (0, response_1.sendError)(res, 'Page content not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Page content retrieved', page);
    }
    catch (err) {
        next(err);
    }
}
async function updatePage(req, res, next) {
    try {
        const page = await cmsService_1.CmsService.upsertPage(req.params.key, req.body);
        return (0, response_1.sendSuccess)(res, 'Page saved', page);
    }
    catch (err) {
        if (err.status === 400)
            return (0, response_1.sendError)(res, err.message, 'VALIDATION_ERROR', 400);
        next(err);
    }
}
async function getGalleryAlbums(_req, res, next) {
    try {
        const albums = await cmsService_1.CmsService.getGalleryAlbums();
        return (0, response_1.sendSuccess)(res, 'Gallery albums retrieved', albums);
    }
    catch (err) {
        next(err);
    }
}
async function getGeography(_req, res, next) {
    try {
        const data = await cmsService_1.CmsService.getGeography();
        return (0, response_1.sendSuccess)(res, 'Geography data retrieved', data);
    }
    catch (err) {
        next(err);
    }
}
