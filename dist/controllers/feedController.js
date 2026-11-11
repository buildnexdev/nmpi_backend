"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFeed = listFeed;
exports.createPost = createPost;
exports.toggleLike = toggleLike;
exports.deletePost = deletePost;
const feedService_1 = require("../services/feedService");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
async function listFeed(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Feed retrieved', await feedService_1.FeedService.list(req.query, req.user?.id || null));
    }
    catch (err) {
        next(err);
    }
}
async function createPost(req, res, next) {
    try {
        const post = await feedService_1.FeedService.create(req.user.id, req.user.member_db_id || null, req.body);
        return (0, response_1.sendSuccess)(res, 'Post created', post, 201);
    }
    catch (err) {
        next(err);
    }
}
async function toggleLike(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Like updated', await feedService_1.FeedService.toggleLike(Number(req.params.id), req.user.id));
    }
    catch (err) {
        next(err);
    }
}
async function deletePost(req, res, next) {
    try {
        const isAdmin = (req.user?.roles || []).some((r) => constants_1.CONTENT_ADMIN_ROLES.includes(r));
        await feedService_1.FeedService.remove(Number(req.params.id), req.user.id, isAdmin);
        return (0, response_1.sendSuccess)(res, 'Post deleted');
    }
    catch (err) {
        next(err);
    }
}
