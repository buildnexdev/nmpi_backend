"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhone = checkPhone;
exports.checkEmail = checkEmail;
exports.checkAadhaar = checkAadhaar;
exports.checkVoterId = checkVoterId;
exports.registerMember = registerMember;
exports.downloadIdCardPdf = downloadIdCardPdf;
exports.downloadIdCardByToken = downloadIdCardByToken;
exports.verifyMemberByToken = verifyMemberByToken;
exports.getMembers = getMembers;
exports.getMemberById = getMemberById;
exports.getMyProfile = getMyProfile;
exports.downloadMyIdCard = downloadMyIdCard;
exports.getMemberQr = getMemberQr;
const fs_1 = __importDefault(require("fs"));
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
async function checkEmail(req, res, next) {
    try {
        const email = String(req.query.email || '').trim().toLowerCase();
        if (!email) {
            return (0, response_1.sendError)(res, 'Email address is required', 'VALIDATION_ERROR', 400);
        }
        const exists = await memberService_1.MemberService.checkEmail(email);
        return (0, response_1.sendSuccess)(res, exists ? 'Email address is already registered' : 'Email address is available', { exists });
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
/** Remove a multer-saved upload when the registration it belonged to did not go through. */
function discardUpload(file) {
    if (!file?.path)
        return;
    fs_1.default.promises.unlink(file.path).catch(() => undefined);
}
async function registerMember(req, res, next) {
    const profileFile = req.file;
    try {
        const data = req.body || {};
        // Validate & normalise before touching the database (throws FieldError on first problem)
        (0, memberService_1.normalizeRegistrationInput)(data);
        const newMember = await memberService_1.MemberService.registerMember(data, profileFile);
        return (0, response_1.sendSuccess)(res, 'Member registered successfully!', newMember, 201);
    }
    catch (err) {
        discardUpload(profileFile);
        if (err && err.field && err.message) {
            const code = /already registered/i.test(err.message) ? 'DUPLICATE_ERROR' : 'VALIDATION_ERROR';
            return (0, response_1.sendError)(res, err.message, code, 400, { field: err.field });
        }
        next(err);
    }
}
async function streamIdCardPdf(res, memberData) {
    const pdfBuffer = await (0, pdfIdCardService_1.generateMemberIdCardPdf)(memberData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Digital_ID_Card_${memberData.member_id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
}
async function downloadIdCardPdf(req, res, next) {
    try {
        const { memberId } = req.params;
        const memberData = await memberService_1.MemberService.getMemberForIdCard(memberId);
        if (!memberData) {
            return (0, response_1.sendError)(res, 'Member record not found.', 'NOT_FOUND', 404);
        }
        return await streamIdCardPdf(res, memberData);
    }
    catch (err) {
        next(err);
    }
}
/** GET /members/id-card/download?token=TOKEN-... — used right after registration (no login yet). */
async function downloadIdCardByToken(req, res, next) {
    try {
        const token = String(req.query.token || '').trim();
        if (!token) {
            return (0, response_1.sendError)(res, 'Download token is required.', 'VALIDATION_ERROR', 400);
        }
        const memberData = await memberService_1.MemberService.getMemberByVerificationToken(token);
        if (!memberData) {
            return (0, response_1.sendError)(res, 'The download link is invalid or has expired.', 'NOT_FOUND', 404);
        }
        return await streamIdCardPdf(res, memberData);
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
        if (!Number.isInteger(id) || id <= 0) {
            return (0, response_1.sendError)(res, 'Member not found', 'NOT_FOUND', 404);
        }
        const member = await memberService_1.MemberService.getMemberById(id);
        if (!member)
            return (0, response_1.sendError)(res, 'Member not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Member retrieved successfully', member);
    }
    catch (err) {
        next(err);
    }
}
async function getMyProfile(req, res, next) {
    try {
        const userId = Number(req.user?.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return (0, response_1.sendError)(res, 'Authorization token required', 'UNAUTHORIZED', 401);
        }
        const profile = await memberService_1.MemberService.getMyProfile(userId);
        if (!profile)
            return (0, response_1.sendError)(res, 'No membership record is linked to this account', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Member profile retrieved', profile);
    }
    catch (err) {
        next(err);
    }
}
async function downloadMyIdCard(req, res, next) {
    try {
        const userId = Number(req.user?.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return (0, response_1.sendError)(res, 'Authorization token required', 'UNAUTHORIZED', 401);
        }
        const member = await memberService_1.MemberService.getMemberById(userId);
        if (!member)
            return (0, response_1.sendError)(res, 'No membership record is linked to this account', 'NOT_FOUND', 404);
        const memberData = await memberService_1.MemberService.getMemberForIdCard(member.id);
        if (!memberData)
            return (0, response_1.sendError)(res, 'Member record not found.', 'NOT_FOUND', 404);
        return await streamIdCardPdf(res, memberData);
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
