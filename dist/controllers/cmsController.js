"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStats = getPublicStats;
exports.listLeaders = listLeaders;
exports.listAllLeaders = listAllLeaders;
exports.createLeader = createLeader;
exports.updateLeader = updateLeader;
exports.deleteLeader = deleteLeader;
exports.listPages = listPages;
exports.getPage = getPage;
exports.savePage = savePage;
const cmsService_1 = require("../services/cmsService");
const response_1 = require("../utils/response");
async function getPublicStats(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Public statistics retrieved', await cmsService_1.CmsService.getPublicStats());
    }
    catch (err) {
        next(err);
    }
}
async function listLeaders(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Leadership list retrieved', await cmsService_1.CmsService.listLeaders(false));
    }
    catch (err) {
        next(err);
    }
}
async function listAllLeaders(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Leadership list retrieved', await cmsService_1.CmsService.listLeaders(true));
    }
    catch (err) {
        next(err);
    }
}
async function createLeader(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Leader added', await cmsService_1.CmsService.saveLeader(req.body), 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateLeader(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Leader updated', await cmsService_1.CmsService.saveLeader(req.body, Number(req.params.id)));
    }
    catch (err) {
        next(err);
    }
}
async function deleteLeader(req, res, next) {
    try {
        await cmsService_1.CmsService.deleteLeader(Number(req.params.id));
        return (0, response_1.sendSuccess)(res, 'Leader removed');
    }
    catch (err) {
        next(err);
    }
}
async function listPages(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Pages retrieved', await cmsService_1.CmsService.listPages());
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
async function savePage(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Page content saved', await cmsService_1.CmsService.savePage(req.params.key, req.body));
    }
    catch (err) {
        next(err);
    }
}
