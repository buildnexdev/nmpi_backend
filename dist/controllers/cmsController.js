"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaders = getLeaders;
exports.getPage = getPage;
exports.getGalleryAlbums = getGalleryAlbums;
exports.getGeography = getGeography;
const cmsService_1 = require("../services/cmsService");
const response_1 = require("../utils/response");
async function getLeaders(req, res, next) {
    try {
        const leaders = await cmsService_1.CmsService.getLeaders();
        return (0, response_1.sendSuccess)(res, 'Leadership list retrieved', leaders);
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
async function getGalleryAlbums(req, res, next) {
    try {
        const albums = await cmsService_1.CmsService.getGalleryAlbums();
        return (0, response_1.sendSuccess)(res, 'Gallery albums retrieved', albums);
    }
    catch (err) {
        next(err);
    }
}
async function getGeography(req, res, next) {
    try {
        const data = await cmsService_1.CmsService.getGeography();
        return (0, response_1.sendSuccess)(res, 'Geography data retrieved', data);
    }
    catch (err) {
        next(err);
    }
}
