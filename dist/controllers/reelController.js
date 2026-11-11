"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReels = listReels;
exports.createReel = createReel;
exports.viewReel = viewReel;
exports.toggleReelLike = toggleReelLike;
exports.deleteReel = deleteReel;
const reelService_1 = require("../services/reelService");
const response_1 = require("../utils/response");
async function listReels(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Reels retrieved', await reelService_1.ReelService.list(req.query, req.user?.id || null));
    }
    catch (err) {
        next(err);
    }
}
async function createReel(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Reel created', await reelService_1.ReelService.create(req.user.id, req.body), 201);
    }
    catch (err) {
        next(err);
    }
}
async function viewReel(req, res, next) {
    try {
        await reelService_1.ReelService.recordView(Number(req.params.id));
        return (0, response_1.sendSuccess)(res, 'View recorded');
    }
    catch (err) {
        next(err);
    }
}
async function toggleReelLike(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Like updated', await reelService_1.ReelService.toggleLike(Number(req.params.id), req.user.id));
    }
    catch (err) {
        next(err);
    }
}
async function deleteReel(req, res, next) {
    try {
        await reelService_1.ReelService.remove(Number(req.params.id));
        return (0, response_1.sendSuccess)(res, 'Reel deleted');
    }
    catch (err) {
        next(err);
    }
}
