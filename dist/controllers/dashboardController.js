"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
const dashboardService_1 = require("../services/dashboardService");
const memberService_1 = require("../services/memberService");
const response_1 = require("../utils/response");
async function getDashboardStats(req, res, next) {
    try {
        const scope = await memberService_1.MemberService.getStaffScope(req.user);
        const stats = await dashboardService_1.DashboardService.getStatistics(scope);
        return (0, response_1.sendSuccess)(res, 'Dashboard statistics calculated', stats);
    }
    catch (err) {
        next(err);
    }
}
