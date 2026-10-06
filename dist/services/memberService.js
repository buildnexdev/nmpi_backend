"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
exports.fieldError = fieldError;
exports.normalizeRegistrationInput = normalizeRegistrationInput;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const generateMemberId_1 = require("../functions/generateMemberId");
const security_1 = require("../utils/security");
const qrCodeGenerator_1 = require("../utils/qrCodeGenerator");
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];
function fieldError(field, message) {
    return { field, message };
}
function str(value) {
    return value === undefined || value === null ? '' : String(value).trim();
}
function optionalId(value) {
    const s = str(value);
    if (!s)
        return null;
    const n = Number(s);
    return Number.isInteger(n) && n > 0 ? n : NaN;
}
/**
 * Validate and normalise the multipart/form-data body of POST /members/register.
 * All values arrive as strings; this converts them to the exact types/values the
 * tblMembers / tblUsers columns accept and throws a FieldError on the first problem.
 */
function normalizeRegistrationInput(data) {
    const fullName = str(data.full_name);
    if (fullName.length < 2 || fullName.length > 100)
        throw fieldError('full_name', 'Please enter your full name.');
    const fatherName = str(data.father_name);
    if (!fatherName || fatherName.length > 100)
        throw fieldError('father_name', "Please enter your father's / husband's name.");
    const dateOfBirth = str(data.date_of_birth);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Number.isNaN(new Date(`${dateOfBirth}T00:00:00Z`).getTime())) {
        throw fieldError('date_of_birth', 'Date of birth must be in YYYY-MM-DD format.');
    }
    const dob = new Date(`${dateOfBirth}T00:00:00Z`);
    const eighteen = new Date(dob);
    eighteen.setUTCFullYear(dob.getUTCFullYear() + 18);
    if (eighteen > new Date())
        throw fieldError('date_of_birth', 'You must be at least 18 years old to join.');
    const gender = str(data.gender).toUpperCase();
    if (!GENDERS.includes(gender))
        throw fieldError('gender', 'Please select a gender.');
    let countryCode = str(data.country_code) || '+91';
    if (!countryCode.startsWith('+'))
        countryCode = `+${countryCode}`;
    if (!/^\+\d{1,4}$/.test(countryCode))
        throw fieldError('country_code', 'Invalid country code.');
    const phoneNumber = str(data.phone_number).replace(/\D/g, '');
    if (phoneNumber.length < 7 || phoneNumber.length > 15)
        throw fieldError('phone_number', 'Please enter a valid mobile number.');
    if (countryCode === '+91' && phoneNumber.length !== 10)
        throw fieldError('phone_number', 'Please enter a 10-digit mobile number.');
    const email = str(data.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191)
        throw fieldError('email', 'Please enter a valid email address.');
    const password = data.password === undefined || data.password === null ? '' : String(data.password);
    if (password.length < 8)
        throw fieldError('password', 'Password must be at least 8 characters.');
    const bloodGroup = str(data.blood_group) || 'Unknown';
    if (!BLOOD_GROUPS.includes(bloodGroup))
        throw fieldError('blood_group', 'Please select a valid blood group.');
    const aadhaar = str(data.aadhaar_number).replace(/\D/g, '');
    if (!/^\d{12}$/.test(aadhaar))
        throw fieldError('aadhaar_number', 'Aadhaar number must be 12 digits.');
    const voterId = str(data.voter_id).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (voterId.length < 6 || voterId.length > 20 || !/^[A-Z0-9]+$/.test(voterId)) {
        throw fieldError('voter_id', 'Please enter a valid Voter ID (EPIC) number.');
    }
    const stateId = optionalId(data.state_id) ?? 1;
    if (Number.isNaN(stateId))
        throw fieldError('state_id', 'Invalid state.');
    const parliamentId = optionalId(data.parliament_constituency_id);
    if (!parliamentId)
        throw fieldError('parliament_constituency_id', 'Please select your parliament constituency.');
    const assemblyId = optionalId(data.assembly_constituency_id);
    if (Number.isNaN(assemblyId))
        throw fieldError('assembly_constituency_id', 'Invalid assembly constituency.');
    const districtId = optionalId(data.district_id);
    if (!districtId)
        throw fieldError('district_id', 'Please select your district.');
    const blockId = optionalId(data.block_id);
    if (!blockId)
        throw fieldError('block_id', 'Please select your taluk / block.');
    const villageId = optionalId(data.village_id);
    if (Number.isNaN(villageId))
        throw fieldError('village_id', 'Invalid village.');
    const villageCustom = str(data.village_custom).slice(0, 100) || null;
    const addressLine1 = str(data.address_line1).slice(0, 255) || null;
    const roleId = optionalId(data.role_id) ?? 1;
    if (Number.isNaN(roleId))
        throw fieldError('role_id', 'Invalid membership type.');
    return {
        fullName,
        fatherName,
        dateOfBirth,
        gender,
        countryCode,
        phoneNumber,
        email,
        password,
        bloodGroup,
        aadhaar,
        voterId,
        stateId,
        parliamentId,
        assemblyId,
        districtId,
        blockId,
        villageId,
        villageCustom,
        addressLine1,
        roleId,
    };
}
/** Translate MySQL constraint errors into user-facing field errors. */
function mapDbError(err) {
    if (!err || !err.code)
        return err;
    if (err.code === 'ER_DUP_ENTRY') {
        const msg = err.sqlMessage || err.message || '';
        if (/email/i.test(msg))
            return fieldError('email', 'This email address is already registered.');
        if (/phone/i.test(msg))
            return fieldError('phone_number', 'This phone number is already registered.');
        if (/aadhaar/i.test(msg))
            return fieldError('aadhaar_number', 'This Aadhaar number is already registered.');
        if (/voter/i.test(msg))
            return fieldError('voter_id', 'This Voter ID is already registered.');
        return fieldError('phone_number', 'A member with these details is already registered.');
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return fieldError('district_id', 'One of the selected location values is invalid. Please re-select and try again.');
    }
    return err;
}
function maskAadhaar(plain) {
    const d = (plain || '').replace(/\D/g, '');
    if (d.length < 4)
        return '';
    return `XXXX XXXX ${d.slice(-4)}`;
}
function maskVoterId(plain) {
    const v = (plain || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (v.length < 4)
        return '';
    return `${v.slice(0, 2)}${'X'.repeat(Math.max(v.length - 4, 2))}${v.slice(-2)}`;
}
/** Strip encrypted / hashed identity columns before sending a member row to a client. */
function toPublicMember(row, fallback) {
    if (!row)
        return { ...fallback, id_card_token: fallback.verification_token };
    const { aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash, ...safe } = row;
    return { ...safe, id_card_token: safe.verification_token || fallback.verification_token };
}
async function toLoggedInProfile(row) {
    const aadhaar = (0, security_1.decryptData)(row.aadhaar_number_encrypted);
    const voter = (0, security_1.decryptData)(row.voter_id_encrypted);
    const { aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash, password_hash, ...safe } = row;
    let qr_data_url = null;
    if (row.verification_token) {
        try {
            qr_data_url = await (0, qrCodeGenerator_1.generateMemberQrDataUrl)(row.verification_token);
        }
        catch {
            qr_data_url = null;
        }
    }
    return {
        ...safe,
        aadhaar_masked: maskAadhaar(aadhaar),
        voter_id_masked: maskVoterId(voter),
        qr_data_url,
    };
}
class MemberService {
    // 1. Check Phone Number Duplicate
    static async checkPhone(countryCode, phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const cleanCode = countryCode.trim() || '+91';
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id FROM tblMembers WHERE country_code = ? AND phone_number = ?`, [cleanCode, cleanPhone]);
            return rows.length > 0;
        }
        else {
            return database_1.mockDbStore.members.some(m => m.mobile.includes(cleanPhone));
        }
    }
    // 1b. Check Email Duplicate (tblUsers.email is unique)
    static async checkEmail(email) {
        const clean = email.trim().toLowerCase();
        if (!clean)
            return false;
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id FROM tblUsers WHERE email = ?`, [clean]);
            return rows.length > 0;
        }
        return database_1.mockDbStore.users.some(u => u.email.toLowerCase() === clean);
    }
    // 2. Check Aadhaar Duplicate
    static async checkAadhaar(aadhaar) {
        const cleanAadhaar = aadhaar.replace(/\D/g, '');
        const hash = (0, security_1.hashSensitiveData)(cleanAadhaar);
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id FROM tblMembers WHERE aadhaar_hash = ?`, [hash]);
            return rows.length > 0;
        }
        return false;
    }
    // 3. Check Voter ID Duplicate
    static async checkVoterId(voterId) {
        const cleanVoter = voterId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const hash = (0, security_1.hashSensitiveData)(cleanVoter);
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id FROM tblMembers WHERE voter_id_hash = ?`, [hash]);
            return rows.length > 0;
        }
        return false;
    }
    // 4. End-to-End Member Registration Transaction
    static async registerMember(data, profileFile) {
        const db = await (0, database_1.getDbConnection)();
        if (!db) {
            throw new Error('Database connection unavailable.');
        }
        const input = normalizeRegistrationInput(data);
        // 4a. Duplicate Checks (email is also unique on tblUsers)
        if (await this.checkPhone(input.countryCode, input.phoneNumber)) {
            throw fieldError('phone_number', 'This phone number is already registered.');
        }
        const [emailRows] = await db.query(`SELECT id FROM tblUsers WHERE email = ?`, [input.email]);
        if (emailRows.length > 0) {
            throw fieldError('email', 'This email address is already registered.');
        }
        if (await this.checkAadhaar(input.aadhaar)) {
            throw fieldError('aadhaar_number', 'This Aadhaar number is already registered.');
        }
        if (await this.checkVoterId(input.voterId)) {
            throw fieldError('voter_id', 'This Voter ID is already registered.');
        }
        // 4b. Location lookups: make sure the chosen IDs exist and belong together
        const [parlRows] = await db.query(`SELECT id, code FROM tblParliament_constituencies WHERE id = ? AND status = 'ACTIVE'`, [input.parliamentId]);
        if (parlRows.length === 0) {
            throw fieldError('parliament_constituency_id', 'Please select a valid parliament constituency.');
        }
        const parliamentCode = parlRows[0].code || 'TN';
        if (input.assemblyId) {
            const [asmRows] = await db.query(`SELECT id FROM tblAssembly_constituencies WHERE id = ? AND status = 'ACTIVE'`, [input.assemblyId]);
            if (asmRows.length === 0) {
                throw fieldError('assembly_constituency_id', 'Please select a valid assembly constituency.');
            }
        }
        const [distRows] = await db.query(`SELECT id FROM tblDistricts WHERE id = ? AND status = 'ACTIVE'`, [input.districtId]);
        if (distRows.length === 0) {
            throw fieldError('district_id', 'Please select a valid district.');
        }
        const [blockRows] = await db.query(`SELECT id FROM tblBlocks WHERE id = ? AND district_id = ? AND status = 'ACTIVE'`, [input.blockId, input.districtId]);
        if (blockRows.length === 0) {
            throw fieldError('block_id', 'Please select a valid taluk / block for the chosen district.');
        }
        if (input.villageId) {
            const [villRows] = await db.query(`SELECT id FROM tblVillages WHERE id = ? AND block_id = ? AND status = 'ACTIVE'`, [input.villageId, input.blockId]);
            if (villRows.length === 0) {
                throw fieldError('village_id', 'Please select a valid village for the chosen block.');
            }
        }
        const [roleRows] = await db.query(`SELECT id, name FROM tblRoles WHERE id = ?`, [input.roleId]);
        if (roleRows.length === 0 || /admin/i.test(roleRows[0].name)) {
            throw fieldError('role_id', 'Please select a valid membership type.');
        }
        // 4c. Profile Photo Path
        const profileImagePath = profileFile ? `/uploads/profiles/${profileFile.filename}` : null;
        // 4d. Password Hashing & Security Encryptions
        const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        const aadhaarHash = (0, security_1.hashSensitiveData)(input.aadhaar);
        const voterIdHash = (0, security_1.hashSensitiveData)(input.voterId);
        const aadhaarEncrypted = (0, security_1.encryptData)(input.aadhaar);
        const voterIdEncrypted = (0, security_1.encryptData)(input.voterId);
        // 4e. MySQL Transaction: user -> role -> member -> QR token
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const [userResult] = await conn.query(`INSERT INTO tblUsers (email, country_code, phone_number, password_hash, status) VALUES (?, ?, ?, ?, 'ACTIVE')`, [input.email, input.countryCode, input.phoneNumber, passwordHash]);
            const userId = userResult.insertId;
            await conn.query(`INSERT INTO tblUser_roles (user_id, role_id) VALUES (?, ?)`, [userId, input.roleId]);
            const memberIdCode = (0, generateMemberId_1.generateMemberId)(userId, parliamentCode);
            const [memberResult] = await conn.query(`INSERT INTO tblMembers (
          user_id, member_id, full_name, father_name, date_of_birth, gender,
          country_code, phone_number, email, profile_image, blood_group,
          aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash,
          state_id, parliament_constituency_id, assembly_constituency_id,
          district_id, block_id, village_id, address_line1, village_custom, role_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`, [
                userId,
                memberIdCode,
                input.fullName,
                input.fatherName,
                input.dateOfBirth,
                input.gender,
                input.countryCode,
                input.phoneNumber,
                input.email,
                profileImagePath,
                input.bloodGroup,
                aadhaarEncrypted,
                voterIdEncrypted,
                aadhaarHash,
                voterIdHash,
                input.stateId,
                input.parliamentId,
                input.assemblyId,
                input.districtId,
                input.blockId,
                input.villageId,
                input.addressLine1,
                input.villageCustom,
                input.roleId
            ]);
            const memberDbId = memberResult.insertId;
            const verificationToken = `TOKEN-${crypto_1.default.randomBytes(16).toString('hex').toUpperCase()}`;
            await conn.query(`INSERT INTO tblMember_qr_codes (member_id, verification_token) VALUES (?, ?)`, [memberDbId, verificationToken]);
            await conn.commit();
            conn.release();
            // Return the full, joined member record so the client can render the ID card immediately
            const created = await this.getMemberForIdCard(memberDbId);
            return toPublicMember(created, {
                id: memberDbId,
                user_id: userId,
                member_id: memberIdCode,
                full_name: input.fullName,
                country_code: input.countryCode,
                phone_number: input.phoneNumber,
                email: input.email,
                verification_token: verificationToken,
                status: 'APPROVED',
            });
        }
        catch (err) {
            await conn.rollback();
            conn.release();
            throw mapDbError(err);
        }
    }
    // 4f. Lookup a member by their QR verification token (used for the post-registration ID card download)
    static async getMemberByVerificationToken(token) {
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            return null;
        const [rows] = await db.query(`SELECT m.id FROM tblMember_qr_codes qr JOIN tblMembers m ON qr.member_id = m.id WHERE qr.verification_token = ?`, [token]);
        if (rows.length === 0)
            return null;
        return this.getMemberForIdCard(rows[0].id);
    }
    // 5. Public Member QR Verification Service
    static async verifyMemberByToken(token) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT 
          m.id, m.member_id, m.full_name, m.gender, m.profile_image, m.blood_group, m.status, m.created_at,
          pc.name_en as parliament_name, pc.name_ta as parliament_name_ta,
          ac.name_en as assembly_name, ac.name_ta as assembly_name_ta,
          d.name_en as district_name, d.name_ta as district_name_ta,
          b.name_en as block_name, b.name_ta as block_name_ta,
          v.name_en as village_name, r.name as role_name
        FROM tblMember_qr_codes qr
        JOIN tblMembers m ON qr.member_id = m.id
        LEFT JOIN tblParliament_constituencies pc ON m.parliament_constituency_id = pc.id
        LEFT JOIN tblAssembly_constituencies ac ON m.assembly_constituency_id = ac.id
        LEFT JOIN tblDistricts d ON m.district_id = d.id
        LEFT JOIN tblBlocks b ON m.block_id = b.id
        LEFT JOIN tblVillages v ON m.village_id = v.id
        LEFT JOIN tblRoles r ON m.role_id = r.id
        WHERE qr.verification_token = ?`, [token]);
            if (rows.length === 0)
                return null;
            return rows[0];
        }
        return null;
    }
    // 6. Get Member Details for PDF ID Card Generation
    static async getMemberForIdCard(memberIdOrDbId) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            // Numeric input = tblMembers.id, otherwise the public member code (e.g. 001CNC00007).
            // Never compare the varchar member_id against a number: MySQL would coerce '001CNC00007' to 1.
            const byDbId = typeof memberIdOrDbId === 'number' || /^\d+$/.test(String(memberIdOrDbId));
            const where = byDbId ? 'm.id = ?' : 'm.member_id = ?';
            const param = byDbId ? Number(memberIdOrDbId) : String(memberIdOrDbId).trim().toUpperCase();
            const [rows] = await db.query(`SELECT 
          m.*, qr.verification_token,
          pc.name_en as parliament_name, pc.name_ta as parliament_name_ta, pc.code as parliament_code,
          ac.name_en as assembly_name, ac.name_ta as assembly_name_ta,
          d.name_en as district_name, d.name_ta as district_name_ta,
          b.name_en as block_name, b.name_ta as block_name_ta,
          v.name_en as village_name, v.name_ta as village_name_ta,
          r.name as role_name
        FROM tblMembers m
        LEFT JOIN tblMember_qr_codes qr ON m.id = qr.member_id
        LEFT JOIN tblParliament_constituencies pc ON m.parliament_constituency_id = pc.id
        LEFT JOIN tblAssembly_constituencies ac ON m.assembly_constituency_id = ac.id
        LEFT JOIN tblDistricts d ON m.district_id = d.id
        LEFT JOIN tblBlocks b ON m.block_id = b.id
        LEFT JOIN tblVillages v ON m.village_id = v.id
        LEFT JOIN tblRoles r ON m.role_id = r.id
        WHERE ${where}`, [param]);
            if (rows.length === 0)
                return null;
            return rows[0];
        }
        return null;
    }
    // Standard List & Filter Members (Admin Panel)
    static async getMembers(filters = {}) {
        const page = Math.max(1, parseInt(String(filters.page || 1), 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(String(filters.pageSize || 20), 10) || 20));
        const offset = (page - 1) * pageSize;
        const db = await (0, database_1.getDbConnection)();
        if (!db) {
            let list = [...database_1.mockDbStore.members];
            if (filters.status)
                list = list.filter((m) => m.status === filters.status);
            if (filters.search) {
                const term = String(filters.search).toLowerCase();
                list = list.filter((m) => [m.full_name, m.member_id, m.phone_number, m.email].some((v) => String(v || '').toLowerCase().includes(term)));
            }
            const total = list.length;
            return { items: list.slice(offset, offset + pageSize), total, page, pageSize };
        }
        let where = ' WHERE 1=1';
        const params = [];
        if (filters.status) {
            where += ' AND m.status = ?';
            params.push(filters.status);
        }
        if (filters.parliament_id) {
            where += ' AND m.parliament_constituency_id = ?';
            params.push(filters.parliament_id);
        }
        if (filters.district_id) {
            where += ' AND m.district_id = ?';
            params.push(filters.district_id);
        }
        if (filters.block_id) {
            where += ' AND m.block_id = ?';
            params.push(filters.block_id);
        }
        if (filters.role_id) {
            where += ' AND m.role_id = ?';
            params.push(filters.role_id);
        }
        if (filters.search) {
            where += ' AND (m.full_name LIKE ? OR m.member_id LIKE ? OR m.phone_number LIKE ? OR m.email LIKE ?)';
            const term = `%${filters.search}%`;
            params.push(term, term, term, term);
        }
        const from = `
      FROM tblMembers m
      LEFT JOIN tblDistricts d ON m.district_id = d.id
      LEFT JOIN tblBlocks b ON m.block_id = b.id
      LEFT JOIN tblParliament_constituencies pc ON m.parliament_constituency_id = pc.id
      LEFT JOIN tblRoles r ON m.role_id = r.id
      ${where}
    `;
        const [countRows] = await db.query(`SELECT COUNT(*) as count ${from}`, params);
        const total = Number(countRows[0]?.count) || 0;
        const [rows] = await db.query(`SELECT m.id, m.user_id, m.member_id, m.full_name, m.email, m.country_code, m.phone_number, m.profile_image,
              m.blood_group, m.status, m.created_at, m.role_id,
              d.name_en as district_name, d.name_ta as district_name_ta,
              b.name_en as block_name, b.name_ta as block_name_ta,
              pc.name_en as parliament_name, pc.name_ta as parliament_name_ta, pc.code as parliament_code,
              r.name as role_name
       ${from}
       ORDER BY m.id DESC
       LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
        return { items: rows, total, page, pageSize };
    }
    static async getMemberById(id) {
        if (!Number.isInteger(id) || id <= 0)
            return null;
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT m.*, d.name_en as district_name, b.name_en as block_name, pc.name_en as parliament_name, r.name as role_name
         FROM tblMembers m
         LEFT JOIN tblDistricts d ON m.district_id = d.id
         LEFT JOIN tblBlocks b ON m.block_id = b.id
         LEFT JOIN tblParliament_constituencies pc ON m.parliament_constituency_id = pc.id
         LEFT JOIN tblRoles r ON m.role_id = r.id
         WHERE m.id = ? OR m.user_id = ?`, [id, id]);
            return rows[0] || null;
        }
        return database_1.mockDbStore.members.find(m => m.id === id);
    }
    /** Logged-in member portal payload: joined names, masked IDs, QR — never the encrypted columns. */
    static async getMyProfile(userId) {
        if (!Number.isInteger(userId) || userId <= 0)
            return null;
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            return null;
        const [idRows] = await db.query('SELECT id FROM tblMembers WHERE user_id = ?', [userId]);
        if (idRows.length === 0)
            return null;
        const row = await this.getMemberForIdCard(idRows[0].id);
        if (!row)
            return null;
        return toLoggedInProfile(row);
    }
    static async getMemberQr(memberDbId) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT * FROM tblMember_qr_codes WHERE member_id = ?', [memberDbId]);
            if (rows.length === 0)
                return null;
            return rows[0];
        }
        return null;
    }
}
exports.MemberService = MemberService;
