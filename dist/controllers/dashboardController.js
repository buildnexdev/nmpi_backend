"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
const dashboardService_1 = require("../services/dashboardService");
const response_1 = require("../utils/response");
async function getDashboardStats(req, res, next) {
    try {
        const stats = await dashboardService_1.DashboardService.getStatistics();
        return (0, response_1.sendSuccess)(res, 'Dashboard statistics calculated', stats);
    }
    catch (err) {
        next(err);
    }
}
