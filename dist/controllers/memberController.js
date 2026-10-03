"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhone = checkPhone;
exports.checkAadhaar = checkAadhaar;
exports.checkVoterId = checkVoterId;
exports.registerMember = registerMember;
exports.downloadIdCardPdf = downloadIdCardPdf;
exports.verifyMemberByToken = verifyMemberByToken;
exports.getMembers = getMembers;
exports.getMemberById = getMemberById;
exports.getMemberQr = getMemberQr;
const memberService_1 = require("../services/memberService");
const response_1 = require("../utils/response");
const pdfIdCardService_1 = require("../services/pdfIdCardService");
async function checkPhone(req, res, next) {
    try {
        const countryCode = String(req.query.countryCode || '+91');
        const phone = String(req.query.phone || '');
        if (!phone) {
            return (0, response_1.sendError)(res, 'Phone number is required', 'VALIDATION_ERROR', 400);
        }
        const exists = await memberService_1.MemberService.checkPhone(countryCode, phone);
        return (0, response_1.sendSuccess)(res, exists ? 'Phone number is already registered' : 'Phone number is available', { exists });
    }
    catch (err) {
        next(err);
    }
}
async function checkAadhaar(req, res, next) {
    try {
        const aadhaar = String(req.query.aadhaar || '');
        if (!aadhaar) {
            return (0, response_1.sendError)(res, 'Aadhaar number is required', 'VALIDATION_ERROR', 400);
        }
        const exists = await memberService_1.MemberService.checkAadhaar(aadhaar);
        return (0, response_1.sendSuccess)(res, exists ? 'Aadhaar number is already registered' : 'Aadhaar number is available', { exists });
    }
    catch (err) {
        next(err);
    }
}
async function checkVoterId(req, res, next) {
    try {
        const voterId = String(req.query.voterId || '');
        if (!voterId) {
            return (0, response_1.sendError)(res, 'Voter ID is required', 'VALIDATION_ERROR', 400);
        }
        const exists = await memberService_1.MemberService.checkVoterId(voterId);
        return (0, response_1.sendSuccess)(res, exists ? 'Voter ID is already registered' : 'Voter ID is available', { exists });
    }
    catch (err) {
        next(err);
    }
}
async function registerMember(req, res, next) {
    try {
        const profileFile = req.file;
        const data = req.body;
        // Standard basic field validations
        if (!data.full_name || !data.father_name || !data.date_of_birth || !data.gender || !data.phone_number || !data.email || !data.password) {
            return (0, response_1.sendError)(res, 'All required personal fields must be provided.', 'VALIDATION_ERROR', 400);
        }
        if (!data.aadhaar_number || !data.voter_id || !data.parliament_constituency_id || !data.district_id || !data.block_id) {
            return (0, response_1.sendError)(res, 'All required location & identity fields must be provided.', 'VALIDATION_ERROR', 400);
        }
        const newMember = await memberService_1.MemberService.registerMember(data, profileFile);
        return (0, response_1.sendSuccess)(res, 'Member registered successfully!', newMember, 201);
    }
    catch (err) {
        if (err.field && err.message) {
            return (0, response_1.sendError)(res, err.message, 'DUPLICATE_ERROR', 400, { field: err.field });
        }
        next(err);
    }
}
async function downloadIdCardPdf(req, res, next) {
    try {
        const { memberId } = req.params;
        const memberData = await memberService_1.MemberService.getMemberForIdCard(memberId);
        if (!memberData) {
            return (0, response_1.sendError)(res, 'Member record not found.', 'NOT_FOUND', 404);
        }
        const pdfBuffer = await (0, pdfIdCardService_1.generateMemberIdCardPdf)(memberData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Digital_ID_Card_${memberData.member_id || memberId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
    }
    catch (err) {
        next(err);
    }
}
async function verifyMemberByToken(req, res, next) {
    try {
        const { token } = req.params;
        const member = await memberService_1.MemberService.verifyMemberByToken(token);
        if (!member) {
            return (0, response_1.sendError)(res, 'Invalid or expired member verification token.', 'NOT_FOUND', 404);
        }
        return (0, response_1.sendSuccess)(res, 'Member identity verified successfully', member);
    }
    catch (err) {
        next(err);
    }
}
async function getMembers(req, res, next) {
    try {
        const members = await memberService_1.MemberService.getMembers(req.query);
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
        if (!member)
            return (0, response_1.sendError)(res, 'Member not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Member retrieved successfully', member);
    }
    catch (err) {
        next(err);
    }
}
async function getMemberQr(req, res, next) {
    try {
        const id = Number(req.params.id);
        const qrData = await memberService_1.MemberService.getMemberQr(id);
        if (!qrData)
            return (0, response_1.sendError)(res, 'QR record not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Member QR code retrieved', qrData);
    }
    catch (err) {
        next(err);
    }
}
