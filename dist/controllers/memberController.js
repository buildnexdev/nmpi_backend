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
exports.downloadIdCardWithToken = downloadIdCardWithToken;
exports.downloadMyIdCard = downloadMyIdCard;
exports.downloadMemberIdCard = downloadMemberIdCard;
exports.verifyMemberByToken = verifyMemberByToken;
exports.getMyProfile = getMyProfile;
exports.getMembers = getMembers;
exports.exportMembersCsv = exportMembersCsv;
exports.getMemberById = getMemberById;
exports.updateMemberStatus = updateMemberStatus;
exports.updateMemberRole = updateMemberRole;
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const memberService_1 = require("../services/memberService");
const response_1 = require("../utils/response");
const pdfIdCardService_1 = require("../services/pdfIdCardService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ID_CARD_TOKEN_PURPOSE = 'id-card-download';
async function sendIdCard(res, memberData) {
    const pdfBuffer = await (0, pdfIdCardService_1.generateMemberIdCardPdf)(memberData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="NMPI_ID_Card_${memberData.member_id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
}
function requireQuery(req, res, key, label) {
    const value = String(req.query[key] || '').trim();
    if (!value) {
        (0, response_1.sendError)(res, `${label} is required`, 'VALIDATION_ERROR', 400);
        return null;
    }
    return value;
}
async function checkPhone(req, res, next) {
    try {
        const phone = requireQuery(req, res, 'phone', 'Phone number');
        if (!phone)
            return;
        const exists = await memberService_1.MemberService.checkPhone(String(req.query.countryCode || '+91'), phone);
        return (0, response_1.sendSuccess)(res, exists ? 'Phone number is already registered' : 'Phone number is available', { exists });
    }
    catch (err) {
        next(err);
    }
}
async function checkEmail(req, res, next) {
    try {
        const email = requireQuery(req, res, 'email', 'Email');
        if (!email)
            return;
        const exists = await memberService_1.MemberService.checkEmail(email);
        return (0, response_1.sendSuccess)(res, exists ? 'Email is already registered' : 'Email is available', { exists });
    }
    catch (err) {
        next(err);
    }
}
async function checkAadhaar(req, res, next) {
    try {
        const aadhaar = requireQuery(req, res, 'aadhaar', 'Aadhaar number');
        if (!aadhaar)
            return;
        const exists = await memberService_1.MemberService.checkAadhaar(aadhaar);
        return (0, response_1.sendSuccess)(res, exists ? 'Aadhaar number is already registered' : 'Aadhaar number is available', { exists });
    }
    catch (err) {
        next(err);
    }
}
async function checkVoterId(req, res, next) {
    try {
        const voterId = requireQuery(req, res, 'voterId', 'Voter ID');
        if (!voterId)
            return;
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
    try {
        const member = await memberService_1.MemberService.registerMember(req.body, req.file);
        const id_card_token = jsonwebtoken_1.default.sign({ purpose: ID_CARD_TOKEN_PURPOSE, member_db_id: member.id }, authMiddleware_1.JWT_SECRET, { expiresIn: '1h' });
        const { verification_token, ...publicMember } = member;
        return (0, response_1.sendSuccess)(res, 'Member registered successfully!', { ...publicMember, id_card_token }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function downloadIdCardWithToken(req, res, next) {
    try {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(String(req.query.token || ''), authMiddleware_1.JWT_SECRET);
        }
        catch {
            return (0, response_1.sendError)(res, 'This download link has expired. Please log in to download your ID card.', 'INVALID_TOKEN', 401);
        }
        if (payload.purpose !== ID_CARD_TOKEN_PURPOSE)
            return (0, response_1.sendError)(res, 'Invalid download token', 'INVALID_TOKEN', 401);
        const memberData = await memberService_1.MemberService.getMemberForIdCard({ id: payload.member_db_id });
        if (!memberData)
            return (0, response_1.sendError)(res, 'Member record not found.', 'NOT_FOUND', 404);
        return sendIdCard(res, memberData);
    }
    catch (err) {
        next(err);
    }
}
async function downloadMyIdCard(req, res, next) {
    try {
        const memberData = await memberService_1.MemberService.getMemberForIdCard({ userId: req.user.id });
        if (!memberData)
            return (0, response_1.sendError)(res, 'No membership record is linked to this account.', 'NOT_FOUND', 404);
        return sendIdCard(res, memberData);
    }
    catch (err) {
        next(err);
    }
}
async function downloadMemberIdCard(req, res, next) {
    try {
        const scope = await memberService_1.MemberService.getStaffScope(req.user);
        const memberData = await memberService_1.MemberService.getMemberForIdCard({ id: Number(req.params.id) }, scope);
        if (!memberData)
            return (0, response_1.sendError)(res, 'Member record not found.', 'NOT_FOUND', 404);
        return sendIdCard(res, memberData);
    }
    catch (err) {
        next(err);
    }
}
async function verifyMemberByToken(req, res, next) {
    try {
        const member = await memberService_1.MemberService.verifyMemberByToken(req.params.token);
        if (!member)
            return (0, response_1.sendError)(res, 'Invalid or unrecognised member QR code.', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Member identity verified successfully', member);
    }
    catch (err) {
        next(err);
    }
}
async function getMyProfile(req, res, next) {
    try {
        const profile = await memberService_1.MemberService.getProfileByUserId(req.user.id);
        if (!profile)
            return (0, response_1.sendError)(res, 'No membership record is linked to this account.', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Profile retrieved successfully', profile);
    }
    catch (err) {
        next(err);
    }
}
async function getMembers(req, res, next) {
    try {
        const scope = await memberService_1.MemberService.getStaffScope(req.user);
        const result = await memberService_1.MemberService.getMembers(req.query, scope);
        return (0, response_1.sendSuccess)(res, 'Members retrieved successfully', result);
    }
    catch (err) {
        next(err);
    }
}
function csvCell(value) {
    const s = value === null || value === undefined ? '' : String(value);
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
}
async function exportMembersCsv(req, res, next) {
    try {
        const scope = await memberService_1.MemberService.getStaffScope(req.user);
        const { items } = await memberService_1.MemberService.getMembers(req.query, scope, false);
        const header = ['Member ID', 'Full Name', 'Phone', 'Email', 'Gender', 'Blood Group', 'Parliament', 'District', 'Taluk / Block', 'Role', 'Status', 'Registered On'];
        const lines = items.map((m) => [m.member_id, m.full_name, `${m.country_code} ${m.phone_number}`, m.email, m.gender, m.blood_group, m.parliament_name, m.district_name, m.block_name, m.role_name, m.status, m.created_at]
            .map(csvCell)
            .join(','));
        const csv = '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\r\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="nmpi_members_${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);
    }
    catch (err) {
        next(err);
    }
}
async function getMemberById(req, res, next) {
    try {
        const scope = await memberService_1.MemberService.getStaffScope(req.user);
        const member = await memberService_1.MemberService.getMemberById(Number(req.params.id), scope);
        if (!member)
            return (0, response_1.sendError)(res, 'Member not found', 'NOT_FOUND', 404);
        return (0, response_1.sendSuccess)(res, 'Member retrieved successfully', member);
    }
    catch (err) {
        next(err);
    }
}
async function updateMemberStatus(req, res, next) {
    try {
        const scope = await memberService_1.MemberService.getStaffScope(req.user);
        const member = await memberService_1.MemberService.updateStatus(Number(req.params.id), String(req.body.status || ''), scope);
        return (0, response_1.sendSuccess)(res, `Member status updated to ${member.status}`, member);
    }
    catch (err) {
        next(err);
    }
}
async function updateMemberRole(req, res, next) {
    try {
        const member = await memberService_1.MemberService.updateRole(Number(req.params.id), Number(req.body.role_id), req.user);
        return (0, response_1.sendSuccess)(res, `Member role updated to ${member.role_name}`, member);
    }
    catch (err) {
        next(err);
    }
}
