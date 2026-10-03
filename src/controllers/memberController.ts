import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { MemberService } from '../services/memberService';
import { sendSuccess, sendError } from '../utils/response';
import { generateMemberIdCardPdf } from '../services/pdfIdCardService';
import { JWT_SECRET } from '../middleware/authMiddleware';
import { AuthRequest } from '../types';

const ID_CARD_TOKEN_PURPOSE = 'id-card-download';

async function sendIdCard(res: Response, memberData: any) {
  const pdfBuffer = await generateMemberIdCardPdf(memberData);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="NMPI_ID_Card_${memberData.member_id}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  return res.end(pdfBuffer);
}

function requireQuery(req: Request, res: Response, key: string, label: string): string | null {
  const value = String(req.query[key] || '').trim();
  if (!value) {
    sendError(res, `${label} is required`, 'VALIDATION_ERROR', 400);
    return null;
  }
  return value;
}

export async function checkPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const phone = requireQuery(req, res, 'phone', 'Phone number');
    if (!phone) return;
    const exists = await MemberService.checkPhone(String(req.query.countryCode || '+91'), phone);
    return sendSuccess(res, exists ? 'Phone number is already registered' : 'Phone number is available', { exists });
  } catch (err) {
    next(err);
  }
}

export async function checkEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const email = requireQuery(req, res, 'email', 'Email');
    if (!email) return;
    const exists = await MemberService.checkEmail(email);
    return sendSuccess(res, exists ? 'Email is already registered' : 'Email is available', { exists });
  } catch (err) {
    next(err);
  }
}

export async function checkAadhaar(req: Request, res: Response, next: NextFunction) {
  try {
    const aadhaar = requireQuery(req, res, 'aadhaar', 'Aadhaar number');
    if (!aadhaar) return;
    const exists = await MemberService.checkAadhaar(aadhaar);
    return sendSuccess(res, exists ? 'Aadhaar number is already registered' : 'Aadhaar number is available', { exists });
  } catch (err) {
    next(err);
  }
}

export async function checkVoterId(req: Request, res: Response, next: NextFunction) {
  try {
    const voterId = requireQuery(req, res, 'voterId', 'Voter ID');
    if (!voterId) return;
    const exists = await MemberService.checkVoterId(voterId);
    return sendSuccess(res, exists ? 'Voter ID is already registered' : 'Voter ID is available', { exists });
  } catch (err) {
    next(err);
  }
}

export async function registerMember(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await MemberService.registerMember(req.body, req.file);
    const id_card_token = jwt.sign({ purpose: ID_CARD_TOKEN_PURPOSE, member_db_id: member!.id }, JWT_SECRET, { expiresIn: '1h' });
    const { verification_token, ...publicMember } = member as any;
    return sendSuccess(res, 'Member registered successfully!', { ...publicMember, id_card_token }, 201);
  } catch (err) {
    next(err);
  }
}

export async function downloadIdCardWithToken(req: Request, res: Response, next: NextFunction) {
  try {
    let payload: any;
    try {
      payload = jwt.verify(String(req.query.token || ''), JWT_SECRET);
    } catch {
      return sendError(res, 'This download link has expired. Please log in to download your ID card.', 'INVALID_TOKEN', 401);
    }
    if (payload.purpose !== ID_CARD_TOKEN_PURPOSE) return sendError(res, 'Invalid download token', 'INVALID_TOKEN', 401);

    const memberData = await MemberService.getMemberForIdCard({ id: payload.member_db_id });
    if (!memberData) return sendError(res, 'Member record not found.', 'NOT_FOUND', 404);
    return sendIdCard(res, memberData);
  } catch (err) {
    next(err);
  }
}

export async function downloadMyIdCard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const memberData = await MemberService.getMemberForIdCard({ userId: req.user!.id });
    if (!memberData) return sendError(res, 'No membership record is linked to this account.', 'NOT_FOUND', 404);
    return sendIdCard(res, memberData);
  } catch (err) {
    next(err);
  }
}

export async function downloadMemberIdCard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const scope = await MemberService.getStaffScope(req.user!);
    const memberData = await MemberService.getMemberForIdCard({ id: Number(req.params.id) }, scope);
    if (!memberData) return sendError(res, 'Member record not found.', 'NOT_FOUND', 404);
    return sendIdCard(res, memberData);
  } catch (err) {
    next(err);
  }
}

export async function verifyMemberByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await MemberService.verifyMemberByToken(req.params.token);
    if (!member) return sendError(res, 'Invalid or unrecognised member QR code.', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Member identity verified successfully', member);
  } catch (err) {
    next(err);
  }
}

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await MemberService.getProfileByUserId(req.user!.id);
    if (!profile) return sendError(res, 'No membership record is linked to this account.', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Profile retrieved successfully', profile);
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const scope = await MemberService.getStaffScope(req.user!);
    const result = await MemberService.getMembers(req.query, scope);
    return sendSuccess(res, 'Members retrieved successfully', result);
  } catch (err) {
    next(err);
  }
}

function csvCell(value: any): string {
  const s = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportMembersCsv(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const scope = await MemberService.getStaffScope(req.user!);
    const { items } = await MemberService.getMembers(req.query, scope, false);
    const header = ['Member ID', 'Full Name', 'Phone', 'Email', 'Gender', 'Blood Group', 'Parliament', 'District', 'Taluk / Block', 'Role', 'Status', 'Registered On'];
    const lines = items.map((m: any) =>
      [m.member_id, m.full_name, `${m.country_code} ${m.phone_number}`, m.email, m.gender, m.blood_group, m.parliament_name, m.district_name, m.block_name, m.role_name, m.status, m.created_at]
        .map(csvCell)
        .join(',')
    );
    const csv = '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nmpi_members_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function getMemberById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const scope = await MemberService.getStaffScope(req.user!);
    const member = await MemberService.getMemberById(Number(req.params.id), scope);
    if (!member) return sendError(res, 'Member not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Member retrieved successfully', member);
  } catch (err) {
    next(err);
  }
}

export async function updateMemberStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const scope = await MemberService.getStaffScope(req.user!);
    const member = await MemberService.updateStatus(Number(req.params.id), String(req.body.status || ''), scope);
    return sendSuccess(res, `Member status updated to ${member!.status}`, member);
  } catch (err) {
    next(err);
  }
}

export async function updateMemberRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const member = await MemberService.updateRole(Number(req.params.id), Number(req.body.role_id), req.user!);
    return sendSuccess(res, `Member role updated to ${member!.role_name}`, member);
  } catch (err) {
    next(err);
  }
}
