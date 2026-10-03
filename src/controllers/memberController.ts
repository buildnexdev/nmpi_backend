import { Request, Response, NextFunction } from 'express';
import { MemberService } from '../services/memberService';
import { sendSuccess, sendError } from '../utils/response';
import { generateMemberIdCardPdf } from '../services/pdfIdCardService';
import { AuthRequest } from '../types';

export async function checkPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const countryCode = String(req.query.countryCode || '+91');
    const phone = String(req.query.phone || '');
    if (!phone) {
      return sendError(res, 'Phone number is required', 'VALIDATION_ERROR', 400);
    }
    const exists = await MemberService.checkPhone(countryCode, phone);
    return sendSuccess(res, exists ? 'Phone number is already registered' : 'Phone number is available', { exists });
  } catch (err) {
    next(err);
  }
}

export async function checkAadhaar(req: Request, res: Response, next: NextFunction) {
  try {
    const aadhaar = String(req.query.aadhaar || '');
    if (!aadhaar) {
      return sendError(res, 'Aadhaar number is required', 'VALIDATION_ERROR', 400);
    }
    const exists = await MemberService.checkAadhaar(aadhaar);
    return sendSuccess(res, exists ? 'Aadhaar number is already registered' : 'Aadhaar number is available', { exists });
  } catch (err) {
    next(err);
  }
}

export async function checkVoterId(req: Request, res: Response, next: NextFunction) {
  try {
    const voterId = String(req.query.voterId || '');
    if (!voterId) {
      return sendError(res, 'Voter ID is required', 'VALIDATION_ERROR', 400);
    }
    const exists = await MemberService.checkVoterId(voterId);
    return sendSuccess(res, exists ? 'Voter ID is already registered' : 'Voter ID is available', { exists });
  } catch (err) {
    next(err);
  }
}

export async function registerMember(req: Request, res: Response, next: NextFunction) {
  try {
    const profileFile = req.file;
    const data = req.body;

    // Standard basic field validations
    if (!data.full_name || !data.father_name || !data.date_of_birth || !data.gender || !data.phone_number || !data.email || !data.password) {
      return sendError(res, 'All required personal fields must be provided.', 'VALIDATION_ERROR', 400);
    }
    if (!data.aadhaar_number || !data.voter_id || !data.parliament_constituency_id || !data.district_id || !data.block_id) {
      return sendError(res, 'All required location & identity fields must be provided.', 'VALIDATION_ERROR', 400);
    }

    const newMember = await MemberService.registerMember(data, profileFile);
    return sendSuccess(res, 'Member registered successfully!', newMember, 201);
  } catch (err: any) {
    if (err.field && err.message) {
      return sendError(res, err.message, 'DUPLICATE_ERROR', 400, { field: err.field });
    }
    next(err);
  }
}

export async function downloadIdCardPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { memberId } = req.params;
    const memberData = await MemberService.getMemberForIdCard(memberId);
    if (!memberData) {
      return sendError(res, 'Member record not found.', 'NOT_FOUND', 404);
    }

    const pdfBuffer = await generateMemberIdCardPdf(memberData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Digital_ID_Card_${memberData.member_id || memberId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

export async function verifyMemberByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const member = await MemberService.verifyMemberByToken(token);
    if (!member) {
      return sendError(res, 'Invalid or expired member verification token.', 'NOT_FOUND', 404);
    }
    return sendSuccess(res, 'Member identity verified successfully', member);
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const members = await MemberService.getMembers(req.query);
    return sendSuccess(res, 'Members retrieved successfully', members);
  } catch (err) {
    next(err);
  }
}

export async function getMemberById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const member = await MemberService.getMemberById(id);
    if (!member) return sendError(res, 'Member not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Member retrieved successfully', member);
  } catch (err) {
    next(err);
  }
}

export async function getMemberQr(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const qrData = await MemberService.getMemberQr(id);
    if (!qrData) return sendError(res, 'QR record not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Member QR code retrieved', qrData);
  } catch (err) {
    next(err);
  }
}
