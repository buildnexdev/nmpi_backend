"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const generateMemberId_1 = require("../functions/generateMemberId");
const security_1 = require("../utils/security");
const qrCodeGenerator_1 = require("../utils/qrCodeGenerator");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const uploadStorage_1 = require("../utils/uploadStorage");
const authService_1 = require("./authService");
const types_1 = require("../types");
const constants_1 = require("../constants");
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
function maskTail(value, visible = 4) {
    if (!value)
        return '';
    return `${'X'.repeat(Math.max(0, value.length - visible))}${value.slice(-visible)}`;
}
function toSafeDetail(row) {
    if (!row)
        return null;
    const { aadhaar_number_encrypted, voter_id_encrypted, ...rest } = row;
    return {
        ...rest,
        aadhaar_masked: maskTail((0, security_1.decryptData)(aadhaar_number_encrypted)),
        voter_id_masked: maskTail((0, security_1.decryptData)(voter_id_encrypted)),
    };
}
function isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}
function ageInYears(dob) {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate()))
        age--;
    return age;
}
function fieldError(field, message) {
    return new types_1.HttpError(400, message, 'VALIDATION_ERROR', { field });
}
class MemberService {
    static async getStaffScope(user) {
        if (user.roles.includes(constants_1.ROLES.SUPER_ADMIN) || user.roles.includes(constants_1.ROLES.ADMIN))
            return null;
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT district_id, block_id, village_id FROM tblMembers WHERE user_id = ?', [user.id]);
        const own = rows[0];
        if (!own)
            return { column: 'm.id', value: -1 };
        if (user.roles.includes(constants_1.ROLES.DISTRICT_ADMIN))
            return { column: 'm.district_id', value: own.district_id };
        if (user.roles.includes(constants_1.ROLES.TALUK_ADMIN))
            return { column: 'm.block_id', value: own.block_id };
        if (user.roles.includes(constants_1.ROLES.UNIT_ADMIN)) {
            return own.village_id ? { column: 'm.village_id', value: own.village_id } : { column: 'm.block_id', value: own.block_id };
        }
        return { column: 'm.id', value: -1 };
    }
    static async checkPhone(countryCode, phone) {
        const db = await (0, database_1.getDbConnection)();
        const cleanPhone = (0, authService_1.normalizePhone)(phone);
        const [rows] = await db.query('SELECT id FROM tblUsers WHERE phone_number = ? UNION SELECT id FROM tblMembers WHERE country_code = ? AND phone_number = ? LIMIT 1', [cleanPhone, (countryCode || '+91').trim(), cleanPhone]);
        return rows.length > 0;
    }
    static async checkEmail(email) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT id FROM tblUsers WHERE email = ? LIMIT 1', [String(email).trim().toLowerCase()]);
        return rows.length > 0;
    }
    static async checkAadhaar(aadhaar) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT id FROM tblMembers WHERE aadhaar_hash = ?', [
            (0, security_1.hashSensitiveData)(aadhaar.replace(/\s+/g, '')),
        ]);
        return rows.length > 0;
    }
    static async checkVoterId(voterId) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT id FROM tblMembers WHERE voter_id_hash = ?', [
            (0, security_1.hashSensitiveData)(voterId.replace(/\s+/g, '').toUpperCase()),
        ]);
        return rows.length > 0;
    }
    static validateRegistration(data) {
        const required = [
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
        if (!['MALE', 'FEMALE', 'OTHER'].includes(data.gender))
            throw fieldError('gender', 'Invalid gender');
        if (!/^\S+@\S+\.\S+$/.test(String(data.email).trim()))
            throw fieldError('email', 'Invalid email address');
        if (!/^\d{10}$/.test((0, authService_1.normalizePhone)(data.phone_number)))
            throw fieldError('phone_number', 'Phone number must be 10 digits');
        if (String(data.password).length < 8)
            throw fieldError('password', 'Password must be at least 8 characters');
        if (!/^\d{12}$/.test(String(data.aadhaar_number).replace(/\s+/g, '')))
            throw fieldError('aadhaar_number', 'Aadhaar number must be 12 digits');
        if (String(data.voter_id).replace(/\s+/g, '').length < 6)
            throw fieldError('voter_id', 'Voter ID must be at least 6 characters');
        if (!isValidDate(data.date_of_birth))
            throw fieldError('date_of_birth', 'Invalid date of birth');
        if (ageInYears(data.date_of_birth) < 18)
            throw fieldError('date_of_birth', 'Members must be at least 18 years old');
    }
    static async registerMember(data, profileFile) {
        this.validateRegistration(data);
        if (!profileFile)
            throw fieldError('profile_image', 'Profile photo is required.');
        const db = await (0, database_1.getDbConnection)();
        const countryCode = (data.country_code || '+91').trim();
        const phoneNumber = (0, authService_1.normalizePhone)(data.phone_number);
        const email = String(data.email).trim().toLowerCase();
        const aadhaarClean = String(data.aadhaar_number).replace(/\s+/g, '');
        const voterIdClean = String(data.voter_id).replace(/\s+/g, '').toUpperCase();
        const requestedRole = Number(data.role_id) || constants_1.ROLE_IDS.MEMBER;
        const roleId = constants_1.SELF_SELECTABLE_ROLE_IDS.includes(requestedRole) ? requestedRole : constants_1.ROLE_IDS.MEMBER;
        const duplicates = [
            [this.checkPhone(countryCode, phoneNumber), 'phone_number', 'This phone number is already registered.'],
            [this.checkEmail(email), 'email', 'This email address is already registered.'],
            [this.checkAadhaar(aadhaarClean), 'aadhaar_number', 'This Aadhaar number is already registered.'],
            [this.checkVoterId(voterIdClean), 'voter_id', 'This Voter ID is already registered.'],
        ];
        for (const [check, field, message] of duplicates) {
            if (await check) {
                throw new types_1.HttpError(409, message, 'DUPLICATE_ERROR', { field });
            }
        }
        const [parlRows] = await db.query('SELECT code FROM tblParliament_constituencies WHERE id = ?', [data.parliament_constituency_id]);
        if (parlRows.length === 0)
            throw fieldError('parliament_constituency_id', 'Invalid parliament constituency');
        const parliamentCode = parlRows[0].code || 'TN';
        const passwordHash = await bcryptjs_1.default.hash(String(data.password), 10);
        const profileFilename = (0, uploadMiddleware_1.nextProfileFileName)(profileFile.originalname);
        let profileImagePath = '';
        try {
            profileImagePath = await (0, uploadStorage_1.storeUpload)('profiles', profileFilename, (0, uploadStorage_1.fileBuffer)(profileFile), profileFile.mimetype || 'image/jpeg');
        }
        catch (err) {
            if (err instanceof types_1.HttpError)
                throw err;
            throw new types_1.HttpError(503, err?.message || 'Could not save the profile photo.', 'UPLOAD_ERROR');
        }
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const [userResult] = await conn.query(`INSERT INTO tblUsers (email, country_code, phone_number, password_hash, status) VALUES (?, ?, ?, ?, 'ACTIVE')`, [email, countryCode, phoneNumber, passwordHash]);
            const userId = userResult.insertId;
            // System access is always "Member"; coordinator/admin access is granted by an administrator.
            await conn.query('INSERT INTO tblUser_roles (user_id, role_id) VALUES (?, ?)', [userId, constants_1.ROLE_IDS.MEMBER]);
            const pendingMemberId = `TMP-${userId}-${Date.now()}`;
            const [memberResult] = await conn.query(`INSERT INTO tblMembers (
          user_id, member_id, full_name, father_name, date_of_birth, gender,
          country_code, phone_number, email, profile_image, blood_group,
          aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash,
          state_id, parliament_constituency_id, assembly_constituency_id,
          district_id, block_id, village_id, address_line1, village_custom, role_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`, [
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
                (0, security_1.encryptData)(aadhaarClean),
                (0, security_1.encryptData)(voterIdClean),
                (0, security_1.hashSensitiveData)(aadhaarClean),
                (0, security_1.hashSensitiveData)(voterIdClean),
                Number(data.state_id) || 1,
                Number(data.parliament_constituency_id),
                Number(data.assembly_constituency_id) || null,
                Number(data.district_id),
                Number(data.block_id),
                Number(data.village_id) || null,
                data.address_line1 || null,
                data.village_custom || null,
                roleId,
            ]);
            const memberDbId = memberResult.insertId;
            const memberIdCode = (0, generateMemberId_1.generateMemberId)(memberDbId, parliamentCode);
            await conn.query('UPDATE tblMembers SET member_id = ? WHERE id = ?', [memberIdCode, memberDbId]);
            const verificationToken = `TOKEN-${crypto_1.default.randomBytes(16).toString('hex').toUpperCase()}`;
            await conn.query('INSERT INTO tblMember_qr_codes (member_id, verification_token) VALUES (?, ?)', [memberDbId, verificationToken]);
            await conn.commit();
            const detail = await this.getMemberById(memberDbId, null);
            const qr_data_url = await (0, qrCodeGenerator_1.generateMemberQrDataUrl)(verificationToken);
            return { ...detail, verification_token: verificationToken, qr_data_url };
        }
        catch (err) {
            await conn.rollback();
            await (0, uploadStorage_1.removeStoredUpload)(profileImagePath);
            if (err instanceof types_1.HttpError)
                throw err;
            throw new types_1.HttpError(500, err?.sqlMessage || err?.message || 'Registration failed', 'INTERNAL_ERROR', { code: err?.code || err?.name || null });
        }
        finally {
            conn.release();
        }
    }
    static async verifyMemberByToken(token) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query(`SELECT
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
      WHERE qr.verification_token = ?`, [token]);
        return rows[0] || null;
    }
    static async getMembers(filters, scope, paginate = true) {
        const db = await (0, database_1.getDbConnection)();
        let where = 'WHERE 1=1';
        const params = [];
        if (scope) {
            where += ` AND ${scope.column} = ?`;
            params.push(scope.value);
        }
        if (filters.status && constants_1.MEMBER_STATUSES.includes(String(filters.status))) {
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
            const [rows] = await db.query(`SELECT ${columns} ${baseQuery} ORDER BY m.id DESC`, params);
            return { items: rows, total: rows.length, page: 1, pageSize: rows.length };
        }
        const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
        const page = Math.max(Number(filters.page) || 1, 1);
        const [[countRow]] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
        const [rows] = await db.query(`SELECT ${columns} ${baseQuery} ORDER BY m.id DESC LIMIT ? OFFSET ?`, [
            ...params,
            pageSize,
            (page - 1) * pageSize,
        ]);
        return { items: rows, total: Number(countRow.total), page, pageSize };
    }
    static async getMemberById(id, scope) {
        const db = await (0, database_1.getDbConnection)();
        let query = `SELECT ${DETAIL_COLUMNS} FROM tblMembers m ${DETAIL_JOINS} WHERE m.id = ?`;
        const params = [id];
        if (scope) {
            query += ` AND ${scope.column} = ?`;
            params.push(scope.value);
        }
        const [rows] = await db.query(query, params);
        return toSafeDetail(rows[0]);
    }
    static async getProfileByUserId(userId) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query(`SELECT ${DETAIL_COLUMNS} FROM tblMembers m ${DETAIL_JOINS} WHERE m.user_id = ?`, [userId]);
        const detail = toSafeDetail(rows[0]);
        if (!detail)
            return null;
        const qr_data_url = detail.verification_token ? await (0, qrCodeGenerator_1.generateMemberQrDataUrl)(detail.verification_token) : null;
        return { ...detail, qr_data_url };
    }
    static async updateStatus(id, status, scope) {
        if (!constants_1.MEMBER_STATUSES.includes(status))
            throw fieldError('status', 'Invalid member status');
        const member = await this.getMemberById(id, scope);
        if (!member)
            throw new types_1.HttpError(404, 'Member not found', 'NOT_FOUND');
        const db = await (0, database_1.getDbConnection)();
        await db.query('UPDATE tblMembers SET status = ? WHERE id = ?', [status, id]);
        await db.query('UPDATE tblUsers SET status = ? WHERE id = ?', [status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE', member.user_id]);
        return this.getMemberById(id, scope);
    }
    static async updateRole(id, roleId, actor) {
        const db = await (0, database_1.getDbConnection)();
        const [roles] = await db.query('SELECT id, name FROM tblRoles WHERE id = ?', [roleId]);
        if (roles.length === 0)
            throw fieldError('role_id', 'Invalid role');
        if (['Admin', 'Super Admin'].includes(roles[0].name) && !actor.roles.includes(constants_1.ROLES.SUPER_ADMIN)) {
            throw new types_1.HttpError(403, 'Only a Super Admin can grant administrator roles', 'FORBIDDEN');
        }
        const member = await this.getMemberById(id, null);
        if (!member)
            throw new types_1.HttpError(404, 'Member not found', 'NOT_FOUND');
        if (member.user_id === actor.id)
            throw new types_1.HttpError(400, 'You cannot change your own role', 'VALIDATION_ERROR');
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('UPDATE tblMembers SET role_id = ? WHERE id = ?', [roleId, id]);
            await conn.query('DELETE FROM tblUser_roles WHERE user_id = ?', [member.user_id]);
            await conn.query('INSERT INTO tblUser_roles (user_id, role_id) VALUES (?, ?)', [member.user_id, roleId]);
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
        return this.getMemberById(id, null);
    }
    static async getMemberForIdCard(where, scope = null) {
        const db = await (0, database_1.getDbConnection)();
        let query = `SELECT ${DETAIL_COLUMNS} FROM tblMembers m ${DETAIL_JOINS} WHERE `;
        const params = [];
        if (where.userId) {
            query += 'm.user_id = ?';
            params.push(where.userId);
        }
        else {
            query += 'm.id = ?';
            params.push(where.id);
        }
        if (scope) {
            query += ` AND ${scope.column} = ?`;
            params.push(scope.value);
        }
        const [rows] = await db.query(query, params);
        return toSafeDetail(rows[0]);
    }
}
exports.MemberService = MemberService;
