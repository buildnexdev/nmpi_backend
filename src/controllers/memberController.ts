import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { MemberService, normalizeRegistrationInput } from '../services/memberService';
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

export async function checkEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return sendError(res, 'Email address is required', 'VALIDATION_ERROR', 400);
    }
    const exists = await MemberService.checkEmail(email);
    return sendSuccess(res, exists ? 'Email address is already registered' : 'Email address is available', { exists });
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

/** Remove a multer-saved upload when the registration it belonged to did not go through. */
function discardUpload(file?: Express.Multer.File) {
  if (!file?.path) return;
  fs.promises.unlink(file.path).catch(() => undefined);
}

export async function registerMember(req: Request, res: Response, next: NextFunction) {
  const profileFile = req.file;
  try {
    const data = req.body || {};

    // Validate & normalise before touching the database (throws FieldError on first problem)
    normalizeRegistrationInput(data);

    const newMember = await MemberService.registerMember(data, profileFile);
    return sendSuccess(res, 'Member registered successfully!', newMember, 201);
  } catch (err: any) {
    discardUpload(profileFile);
    if (err && err.field && err.message) {
      const code = /already registered/i.test(err.message) ? 'DUPLICATE_ERROR' : 'VALIDATION_ERROR';
      return sendError(res, err.message, code, 400, { field: err.field });
    }
    next(err);
  }
}

async function streamIdCardPdf(res: Response, memberData: any) {
  const pdfBuffer = await generateMemberIdCardPdf(memberData);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Digital_ID_Card_${memberData.member_id}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  return res.end(pdfBuffer);
}

export async function downloadIdCardPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { memberId } = req.params;
    const memberData = await MemberService.getMemberForIdCard(memberId);
    if (!memberData) {
      return sendError(res, 'Member record not found.', 'NOT_FOUND', 404);
    }
    return await streamIdCardPdf(res, memberData);
  } catch (err) {
    next(err);
  }
}

/** GET /members/id-card/download?token=TOKEN-... — used right after registration (no login yet). */
export async function downloadIdCardByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) {
      return sendError(res, 'Download token is required.', 'VALIDATION_ERROR', 400);
    }
    const memberData = await MemberService.getMemberByVerificationToken(token);
    if (!memberData) {
      return sendError(res, 'The download link is invalid or has expired.', 'NOT_FOUND', 404);
    }
    return await streamIdCardPdf(res, memberData);
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
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 'Member not found', 'NOT_FOUND', 404);
    }
    const member = await MemberService.getMemberById(id);
    if (!member) return sendError(res, 'Member not found', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Member retrieved successfully', member);
  } catch (err) {
    next(err);
  }
}

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, 'Authorization token required', 'UNAUTHORIZED', 401);
    }
    const profile = await MemberService.getMyProfile(userId);
    if (!profile) return sendError(res, 'No membership record is linked to this account', 'NOT_FOUND', 404);
    return sendSuccess(res, 'Member profile retrieved', profile);
  } catch (err) {
    next(err);
  }
}

export async function downloadMyIdCard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, 'Authorization token required', 'UNAUTHORIZED', 401);
    }
    const member = await MemberService.getMemberById(userId);
    if (!member) return sendError(res, 'No membership record is linked to this account', 'NOT_FOUND', 404);
    const memberData = await MemberService.getMemberForIdCard(member.id);
    if (!memberData) return sendError(res, 'Member record not found.', 'NOT_FOUND', 404);
    return await streamIdCardPdf(res, memberData);
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
