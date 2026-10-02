"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMembers = getMembers;
exports.getMemberById = getMemberById;
exports.getMyProfile = getMyProfile;
exports.updateStatus = updateStatus;
exports.getMemberQr = getMemberQr;
const memberService_1 = require("../services/memberService");
const response_1 = require("../utils/response");
async function getMembers(req, res, next) {
    try {
        const filters = {
            status: req.query.status,
            district_id: req.query.district_id,
            taluk_id: req.query.taluk_id,
            unit_id: req.query.unit_id,
            search: req.query.search,
        };
        const members = await memberService_1.MemberService.getMembers(filters);
        return (0, response_1.sendSuccess)(res, 'Members retrieved successfully', members);
    }
    catch (err) {
        next(err);
    }
}
async function getMemberById(req, res, next) {
    try {
        const id = Number(req.params.id);
        const member = await memberService_1.MemberService.getMemberById(id);
        if (!member) {
            return (0, response_1.sendError)(res, 'Member not found', 'NOT_FOUND', 404);
        }
        return (0, response_1.sendSuccess)(res, 'Member retrieved successfully', member);
    }
    catch (err) {
        next(err);
    }
}
async function getMyProfile(req, res, next) {
    try {
        if (!req.user)
            return (0, response_1.sendError)(res, 'Unauthorized', 'UNAUTHORIZED', 401);
        const member = await memberService_1.MemberService.getMemberById(req.user.id);
        return (0, response_1.sendSuccess)(res, 'My profile retrieved', member);
    }
    catch (err) {
        next(err);
    }
}
async function updateStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        if (!status) {
            return (0, response_1.sendError)(res, 'Status is required', 'VALIDATION_ERROR', 400);
        }
        const result = await memberService_1.MemberService.updateStatus(id, status, req.user?.id);
        return (0, response_1.sendSuccess)(res, `Member status updated to ${status}`, result);
    }
    catch (err) {
        next(err);
    }
}
async function getMemberQr(req, res, next) {
    try {
        const id = Number(req.params.id);
        const qrData = await memberService_1.MemberService.getMemberQr(id);
        if (!qrData) {
            return (0, response_1.sendError)(res, 'QR identity record not found for member', 'NOT_FOUND', 404);
        }
        return (0, response_1.sendSuccess)(res, 'Member QR identity retrieved', qrData);
    }
    catch (err) {
        next(err);
    }
}
