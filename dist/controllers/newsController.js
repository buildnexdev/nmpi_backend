"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewsList = getNewsList;
exports.getNewsAdminList = getNewsAdminList;
exports.getNewsById = getNewsById;
exports.createNews = createNews;
exports.updateNews = updateNews;
exports.deleteNews = deleteNews;
const newsService_1 = require("../services/newsService");
const response_1 = require("../utils/response");
async function getNewsList(req, res, next) {
    try {
        const filters = {
            status: req.query.status || 'PUBLISHED',
            is_featured: req.query.is_featured === undefined ? undefined : req.query.is_featured === 'true',
            category: req.query.category,
            search: req.query.search,
            limit: req.query.limit,
        };
        const news = await newsService_1.NewsService.getNewsList(filters);
        return (0, response_1.sendSuccess)(res, 'News list retrieved', news);
    }
    catch (err) {
        next(err);
    }
}
async function getNewsAdminList(req, res, next) {
    try {
        const filters = {
            status: req.query.status || undefined,
            search: req.query.search,
        };
        const news = await newsService_1.NewsService.getNewsList(filters);
        return (0, response_1.sendSuccess)(res, 'News list retrieved', news);
    }
    catch (err) {
        next(err);
    }
}
async function getNewsById(req, res, next) {
    try {
        const news = await newsService_1.NewsService.getNewsById(req.params.id);
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
        const authorId = req.user?.id || 1;
        const result = await newsService_1.NewsService.createNews(req.body, authorId);
        return (0, response_1.sendSuccess)(res, 'News article created successfully', result, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateNews(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return (0, response_1.sendError)(res, 'Invalid news id', 'VALIDATION_ERROR', 400);
        const result = await newsService_1.NewsService.updateNews(id, req.body);
        if (!result)
            return (0, response_1.sendError)(res, 'News article not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'News article updated', result);
    }
    catch (err) {
        next(err);
    }
}
async function deleteNews(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return (0, response_1.sendError)(res, 'Invalid news id', 'VALIDATION_ERROR', 400);
        const ok = await newsService_1.NewsService.deleteNews(id);
        if (!ok)
            return (0, response_1.sendError)(res, 'News article not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'News article deleted', { id });
    }
    catch (err) {
        next(err);
    }
}
