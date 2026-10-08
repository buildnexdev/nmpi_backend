"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublished = listPublished;
exports.listAll = listAll;
exports.getPublished = getPublished;
exports.createNews = createNews;
exports.updateNews = updateNews;
exports.deleteNews = deleteNews;
const newsService_1 = require("../services/newsService");
const response_1 = require("../utils/response");
async function listPublished(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'News list retrieved', await newsService_1.NewsService.list(req.query, false));
    }
    catch (err) {
        next(err);
    }
}
async function listAll(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'News list retrieved', await newsService_1.NewsService.list(req.query, true));
    }
    catch (err) {
        next(err);
    }
}
async function getPublished(req, res, next) {
    try {
        const news = await newsService_1.NewsService.get(req.params.id, false);
        if (!news)
            return (0, response_1.sendError)(res, 'News article not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'News article retrieved', news);
    }
    catch (err) {
        next(err);
    }
}
async function createNews(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'News article published', await newsService_1.NewsService.create(req.body, req.user.id), 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateNews(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'News article updated', await newsService_1.NewsService.update(Number(req.params.id), req.body));
    }
    catch (err) {
        next(err);
    }
}
async function deleteNews(req, res, next) {
    try {
        await newsService_1.NewsService.remove(Number(req.params.id));
        return (0, response_1.sendSuccess)(res, 'News article deleted');
    }
    catch (err) {
        next(err);
    }
}
