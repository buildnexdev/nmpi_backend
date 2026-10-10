import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDbConnection } from '../config/database';
import { generateMemberId } from '../functions/generateMemberId';
import { hashSensitiveData, encryptData, decryptData } from '../utils/security';
import { generateMemberQrDataUrl } from '../utils/qrCodeGenerator';
import { nextProfileFileName } from '../middleware/uploadMiddleware';
import { fileBuffer, removeStoredUpload, storeUpload } from '../utils/uploadStorage';
import { normalizePhone } from './authService';
import { AuthUser, HttpError } from '../types';
import { ROLES, ROLE_IDS, SELF_SELECTABLE_ROLE_IDS, MEMBER_STATUSES } from '../constants';

export interface StaffScope {
  column: string;
  value: number;
}

const DETAIL_JOINS = `
  LEFT JOIN tblParliament_constituencies pc ON m.parliament_constituency_id = pc.id
  LEFT JOIN tblAssembly_constituencies ac ON m.assembly_constituency_id = ac.id
  LEFT JOIN tblDistricts d ON m.district_id = d.id
  LEFT JOIN tblBlocks b ON m.block_id = b.id
  LEFT JOIN tblVillages v ON m.village_id = v.id
  LEFT JOIN tblRoles r ON m.role_id = r.id
  LEFT JOIN tblMember_qr_codes qr ON qr.member_id = m.id
`;

const DETAIL_COLUMNS = `
  m.id, m.user_id, m.member_id, m.full_name, m.father_name, m.date_of_birth, m.gender,
  m.country_code, m.phone_number, m.email, m.profile_image, m.blood_group,
  m.aadhaar_number_encrypted, m.voter_id_encrypted,
  m.state_id, m.parliament_constituency_id, m.assembly_constituency_id, m.district_id, m.block_id, m.village_id,
  m.address_line1, m.village_custom, m.role_id, m.status, m.created_at, m.updated_at,
  pc.name_en AS parliament_name, pc.name_ta AS parliament_name_ta, pc.code AS parliament_code,
  ac.name_en AS assembly_name, ac.name_ta AS assembly_name_ta,
  d.name_en AS district_name, d.name_ta AS district_name_ta,
  b.name_en AS block_name, b.name_ta AS block_name_ta,
  v.name_en AS village_name,
  r.name AS role_name,
  qr.verification_token
`;

function maskTail(value: string, visible = 4): string {
  if (!value) return '';
  return `${'X'.repeat(Math.max(0, value.length - visible))}${value.slice(-visible)}`;
}

function toSafeDetail(row: any) {
  if (!row) return null;
  const { aadhaar_number_encrypted, voter_id_encrypted, ...rest } = row;
  return {
    ...rest,
    aadhaar_masked: maskTail(decryptData(aadhaar_number_encrypted)),
    voter_id_masked: maskTail(decryptData(voter_id_encrypted)),
  };
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function ageInYears(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function fieldError(field: string, message: string): HttpError {
  return new HttpError(400, message, 'VALIDATION_ERROR', { field });
}

export class MemberService {
  static async getStaffScope(user: AuthUser): Promise<StaffScope | null> {
    if (user.roles.includes(ROLES.SUPER_ADMIN) || user.roles.includes(ROLES.ADMIN)) return null;

    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT district_id, block_id, village_id FROM tblMembers WHERE user_id = ?', [user.id]);
    const own = rows[0];
    if (!own) return { column: 'm.id', value: -1 };

    if (user.roles.includes(ROLES.DISTRICT_ADMIN)) return { column: 'm.district_id', value: own.district_id };
    if (user.roles.includes(ROLES.TALUK_ADMIN)) return { column: 'm.block_id', value: own.block_id };
    if (user.roles.includes(ROLES.UNIT_ADMIN)) {
      return own.village_id ? { column: 'm.village_id', value: own.village_id } : { column: 'm.block_id', value: own.block_id };
    }
    return { column: 'm.id', value: -1 };
  }

  static async checkPhone(countryCode: string, phone: string): Promise<boolean> {
    const db = await getDbConnection();
    const cleanPhone = normalizePhone(phone);
    const [rows]: any = await db.query(
      'SELECT id FROM tblUsers WHERE phone_number = ? UNION SELECT id FROM tblMembers WHERE country_code = ? AND phone_number = ? LIMIT 1',
      [cleanPhone, (countryCode || '+91').trim(), cleanPhone]
    );
    return rows.length > 0;
  }

  static async checkEmail(email: string): Promise<boolean> {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT id FROM tblUsers WHERE email = ? LIMIT 1', [String(email).trim().toLowerCase()]);
    return rows.length > 0;
  }

  static async checkAadhaar(aadhaar: string): Promise<boolean> {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT id FROM tblMembers WHERE aadhaar_hash = ?', [
      hashSensitiveData(aadhaar.replace(/\s+/g, '')),
    ]);
    return rows.length > 0;
  }

  static async checkVoterId(voterId: string): Promise<boolean> {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT id FROM tblMembers WHERE voter_id_hash = ?', [
      hashSensitiveData(voterId.replace(/\s+/g, '').toUpperCase()),
    ]);
    return rows.length > 0;
  }

  static validateRegistration(data: any) {
    const required: Array<[string, string]> = [
      ['full_name', 'Full name is required'],
      ['father_name', "Father's name is required"],
      ['date_of_birth', 'Date of birth is required'],
      ['gender', 'Gender is required'],
      ['phone_number', 'Phone number is required'],
      ['email', 'Email is required'],
      ['password', 'Password is required'],
      ['aadhaar_number', 'Aadhaar number is required'],
      ['voter_id', 'Voter ID is required'],
      ['parliament_constituency_id', 'Parliament constituency is required'],
      ['district_id', 'District is required'],
      ['block_id', 'Taluk / Block is required'],
    ];
    for (const [field, message] of required) {
      if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '' || String(data[field]) === '0') {
        throw fieldError(field, message);
      }
    }

    if (!['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) throw fieldError('gender', 'Invalid gender');
    if (!/^\S+@\S+\.\S+$/.test(String(data.email).trim())) throw fieldError('email', 'Invalid email address');
    if (!/^\d{10}$/.test(normalizePhone(data.phone_number))) throw fieldError('phone_number', 'Phone number must be 10 digits');
    if (String(data.password).length < 8) throw fieldError('password', 'Password must be at least 8 characters');
    if (!/^\d{12}$/.test(String(data.aadhaar_number).replace(/\s+/g, ''))) throw fieldError('aadhaar_number', 'Aadhaar number must be 12 digits');
    if (String(data.voter_id).replace(/\s+/g, '').length < 6) throw fieldError('voter_id', 'Voter ID must be at least 6 characters');
    if (!isValidDate(data.date_of_birth)) throw fieldError('date_of_birth', 'Invalid date of birth');
    if (ageInYears(data.date_of_birth) < 18) throw fieldError('date_of_birth', 'Members must be at least 18 years old');
  }

  static async registerMember(data: any, profileFile?: Express.Multer.File) {
    this.validateRegistration(data);
    if (!profileFile) throw fieldError('profile_image', 'Profile photo is required.');

    const db = await getDbConnection();
    const countryCode = (data.country_code || '+91').trim();
    const phoneNumber = normalizePhone(data.phone_number);
    const email = String(data.email).trim().toLowerCase();
    const aadhaarClean = String(data.aadhaar_number).replace(/\s+/g, '');
    const voterIdClean = String(data.voter_id).replace(/\s+/g, '').toUpperCase();
    const requestedRole = Number(data.role_id) || ROLE_IDS.MEMBER;
    const roleId = SELF_SELECTABLE_ROLE_IDS.includes(requestedRole) ? requestedRole : ROLE_IDS.MEMBER;

    const duplicates: Array<[Promise<boolean>, string, string]> = [
      [this.checkPhone(countryCode, phoneNumber), 'phone_number', 'This phone number is already registered.'],
      [this.checkEmail(email), 'email', 'This email address is already registered.'],
      [this.checkAadhaar(aadhaarClean), 'aadhaar_number', 'This Aadhaar number is already registered.'],
      [this.checkVoterId(voterIdClean), 'voter_id', 'This Voter ID is already registered.'],
    ];
    for (const [check, field, message] of duplicates) {
      if (await check) {
        throw new HttpError(409, message, 'DUPLICATE_ERROR', { field });
      }
    }

    const [parlRows]: any = await db.query('SELECT code FROM tblParliament_constituencies WHERE id = ?', [data.parliament_constituency_id]);
    if (parlRows.length === 0) throw fieldError('parliament_constituency_id', 'Invalid parliament constituency');
    const parliamentCode = parlRows[0].code || 'TN';

    const passwordHash = await bcrypt.hash(String(data.password), 10);
    const profileFilename = nextProfileFileName(profileFile.originalname);
    const profileImagePath = await storeUpload(
      'profiles',
      profileFilename,
      fileBuffer(profileFile),
      profileFile.mimetype,
    );

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [userResult]: any = await conn.query(
        `INSERT INTO tblUsers (email, country_code, phone_number, password_hash, status) VALUES (?, ?, ?, ?, 'ACTIVE')`,
        [email, countryCode, phoneNumber, passwordHash]
      );
      const userId = userResult.insertId;

      // System access is always "Member"; coordinator/admin access is granted by an administrator.
      await conn.query('INSERT INTO tblUser_roles (user_id, role_id) VALUES (?, ?)', [userId, ROLE_IDS.MEMBER]);

      const pendingMemberId = `TMP-${userId}-${Date.now()}`;

      const [memberResult]: any = await conn.query(
        `INSERT INTO tblMembers (
          user_id, member_id, full_name, father_name, date_of_birth, gender,
          country_code, phone_number, email, profile_image, blood_group,
          aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash,
          state_id, parliament_constituency_id, assembly_constituency_id,
          district_id, block_id, village_id, address_line1, village_custom, role_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
        [
          userId,
          pendingMemberId,
          String(data.full_name).trim(),
          String(data.father_name).trim(),
          data.date_of_birth,
          data.gender,
          countryCode,
          phoneNumber,
          email,
          profileImagePath,
          data.blood_group || 'Unknown',
          encryptData(aadhaarClean),
          encryptData(voterIdClean),
          hashSensitiveData(aadhaarClean),
          hashSensitiveData(voterIdClean),
          Number(data.state_id) || 1,
          Number(data.parliament_constituency_id),
          Number(data.assembly_constituency_id) || null,
          Number(data.district_id),
          Number(data.block_id),
          Number(data.village_id) || null,
          data.address_line1 || null,
          data.village_custom || null,
          roleId,
        ]
      );
      const memberDbId = memberResult.insertId;
      const memberIdCode = generateMemberId(memberDbId, parliamentCode);
      await conn.query('UPDATE tblMembers SET member_id = ? WHERE id = ?', [memberIdCode, memberDbId]);

      const verificationToken = `TOKEN-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
      await conn.query('INSERT INTO tblMember_qr_codes (member_id, verification_token) VALUES (?, ?)', [memberDbId, verificationToken]);

      await conn.commit();

      const detail = await this.getMemberById(memberDbId, null);
      const qr_data_url = await generateMemberQrDataUrl(verificationToken);
      return { ...detail, verification_token: verificationToken, qr_data_url };
    } catch (err) {
      await conn.rollback();
      await removeStoredUpload(profileImagePath);
      throw err;
    } finally {
      conn.release();
    }
  }

  static async verifyMemberByToken(token: string) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(
      `SELECT
        m.member_id, m.full_name, m.father_name, m.date_of_birth, m.gender,
        m.country_code, m.phone_number, m.email, m.profile_image, m.blood_group,
        m.address_line1, m.village_custom, m.status, m.created_at,
        pc.name_en AS parliament_name, pc.name_ta AS parliament_name_ta, pc.code AS parliament_code,
        ac.name_en AS assembly_name, ac.name_ta AS assembly_name_ta,
        d.name_en AS district_name, d.name_ta AS district_name_ta,
        b.name_en AS block_name, b.name_ta AS block_name_ta,
        v.name_en AS village_name, r.name AS role_name
      FROM tblMember_qr_codes qr
      JOIN tblMembers m ON qr.member_id = m.id
      LEFT JOIN tblParliament_constituencies pc ON m.parliament_constituency_id = pc.id
      LEFT JOIN tblAssembly_constituencies ac ON m.assembly_constituency_id = ac.id
      LEFT JOIN tblDistricts d ON m.district_id = d.id
      LEFT JOIN tblBlocks b ON m.block_id = b.id
      LEFT JOIN tblVillages v ON m.village_id = v.id
      LEFT JOIN tblRoles r ON m.role_id = r.id
      WHERE qr.verification_token = ?`,
      [token]
    );
    return rows[0] || null;
  }

  static async getMembers(filters: any, scope: StaffScope | null, paginate = true) {
    const db = await getDbConnection();
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (scope) {
      where += ` AND ${scope.column} = ?`;
      params.push(scope.value);
    }
    if (filters.status && MEMBER_STATUSES.includes(String(filters.status))) {
      where += ' AND m.status = ?';
      params.push(filters.status);
    }
    for (const [key, column] of [
      ['parliament_id', 'm.parliament_constituency_id'],
      ['district_id', 'm.district_id'],
      ['block_id', 'm.block_id'],
      ['role_id', 'm.role_id'],
    ]) {
      if (filters[key]) {
        where += ` AND ${column} = ?`;
        params.push(Number(filters[key]));
      }
    }
    if (filters.search) {
      where += ' AND (m.full_name LIKE ? OR m.member_id LIKE ? OR m.phone_number LIKE ? OR m.email LIKE ?)';
      const term = `%${String(filters.search).trim()}%`;
      params.push(term, term, term, term);
    }

    const baseQuery = `
      FROM tblMembers m
      LEFT JOIN tblDistricts d ON m.district_id = d.id
      LEFT JOIN tblBlocks b ON m.block_id = b.id
      LEFT JOIN tblParliament_constituencies pc ON m.parliament_constituency_id = pc.id
      LEFT JOIN tblRoles r ON m.role_id = r.id
      ${where}`;

    const columns = `
      m.id, m.member_id, m.full_name, m.email, m.country_code, m.phone_number, m.blood_group, m.gender,
      m.profile_image, m.status, m.role_id, m.created_at,
      d.name_en AS district_name, d.name_ta AS district_name_ta,
      b.name_en AS block_name, b.name_ta AS block_name_ta,
      pc.name_en AS parliament_name, pc.name_ta AS parliament_name_ta, pc.code AS parliament_code,
      r.name AS role_name`;

    if (!paginate) {
      const [rows]: any = await db.query(`SELECT ${columns} ${baseQuery} ORDER BY m.id DESC`, params);
      return { items: rows, total: rows.length, page: 1, pageSize: rows.length };
    }

    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
    const page = Math.max(Number(filters.page) || 1, 1);
    const [[countRow]]: any = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
    const [rows]: any = await db.query(`SELECT ${columns} ${baseQuery} ORDER BY m.id DESC LIMIT ? OFFSET ?`, [
      ...params,
      pageSize,
      (page - 1) * pageSize,
    ]);

    return { items: rows, total: Number(countRow.total), page, pageSize };
  }

  static async getMemberById(id: number, scope: StaffScope | null) {
    const db = await getDbConnection();
    let query = `SELECT ${DETAIL_COLUMNS} FROM tblMembers m ${DETAIL_JOINS} WHERE m.id = ?`;
    const params: any[] = [id];
    if (scope) {
      query += ` AND ${scope.column} = ?`;
      params.push(scope.value);
    }
    const [rows]: any = await db.query(query, params);
    return toSafeDetail(rows[0]);
  }

  static async getProfileByUserId(userId: number) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(`SELECT ${DETAIL_COLUMNS} FROM tblMembers m ${DETAIL_JOINS} WHERE m.user_id = ?`, [userId]);
    const detail = toSafeDetail(rows[0]);
    if (!detail) return null;
    const qr_data_url = detail.verification_token ? await generateMemberQrDataUrl(detail.verification_token) : null;
    return { ...detail, qr_data_url };
  }

  static async updateStatus(id: number, status: string, scope: StaffScope | null) {
    if (!MEMBER_STATUSES.includes(status)) throw fieldError('status', 'Invalid member status');
    const member = await this.getMemberById(id, scope);
    if (!member) throw new HttpError(404, 'Member not found', 'NOT_FOUND');

    const db = await getDbConnection();
    await db.query('UPDATE tblMembers SET status = ? WHERE id = ?', [status, id]);
    await db.query('UPDATE tblUsers SET status = ? WHERE id = ?', [status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE', member.user_id]);
    return this.getMemberById(id, scope);
  }

  static async updateRole(id: number, roleId: number, actor: AuthUser) {
    const db = await getDbConnection();
    const [roles]: any = await db.query('SELECT id, name FROM tblRoles WHERE id = ?', [roleId]);
    if (roles.length === 0) throw fieldError('role_id', 'Invalid role');
    if (['Admin', 'Super Admin'].includes(roles[0].name) && !actor.roles.includes(ROLES.SUPER_ADMIN)) {
      throw new HttpError(403, 'Only a Super Admin can grant administrator roles', 'FORBIDDEN');
    }

    const member = await this.getMemberById(id, null);
    if (!member) throw new HttpError(404, 'Member not found', 'NOT_FOUND');
    if (member.user_id === actor.id) throw new HttpError(400, 'You cannot change your own role', 'VALIDATION_ERROR');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE tblMembers SET role_id = ? WHERE id = ?', [roleId, id]);
      await conn.query('DELETE FROM tblUser_roles WHERE user_id = ?', [member.user_id]);
      await conn.query('INSERT INTO tblUser_roles (user_id, role_id) VALUES (?, ?)', [member.user_id, roleId]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return this.getMemberById(id, null);
  }

  static async getMemberForIdCard(where: { id?: number; userId?: number }, scope: StaffScope | null = null) {
    const db = await getDbConnection();
    let query = `SELECT ${DETAIL_COLUMNS} FROM tblMembers m ${DETAIL_JOINS} WHERE `;
    const params: any[] = [];
    if (where.userId) {
      query += 'm.user_id = ?';
      params.push(where.userId);
    } else {
      query += 'm.id = ?';
      params.push(where.id);
    }
    if (scope) {
      query += ` AND ${scope.column} = ?`;
      params.push(scope.value);
    }
    const [rows]: any = await db.query(query, params);
    return toSafeDetail(rows[0]);
  }
}
