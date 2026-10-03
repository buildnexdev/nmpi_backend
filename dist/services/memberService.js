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
class MemberService {
    // 1. Check Phone Number Duplicate
    static async checkPhone(countryCode, phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const cleanCode = countryCode.trim() || '+91';
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id FROM members WHERE country_code = ? AND phone_number = ?`, [cleanCode, cleanPhone]);
            return rows.length > 0;
        }
        else {
            return database_1.mockDbStore.members.some(m => m.mobile.includes(cleanPhone));
        }
    }
    // 2. Check Aadhaar Duplicate
    static async checkAadhaar(aadhaar) {
        const cleanAadhaar = aadhaar.replace(/\s+/g, '').trim();
        const hash = (0, security_1.hashSensitiveData)(cleanAadhaar);
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id FROM members WHERE aadhaar_hash = ?`, [hash]);
            return rows.length > 0;
        }
        return false;
    }
    // 3. Check Voter ID Duplicate
    static async checkVoterId(voterId) {
        const cleanVoter = voterId.replace(/\s+/g, '').toUpperCase().trim();
        const hash = (0, security_1.hashSensitiveData)(cleanVoter);
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id FROM members WHERE voter_id_hash = ?`, [hash]);
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
        const countryCode = data.country_code || '+91';
        const phoneNumber = data.phone_number.replace(/\D/g, '');
        const email = data.email.trim().toLowerCase();
        const aadhaarClean = data.aadhaar_number.replace(/\s+/g, '').trim();
        const voterIdClean = data.voter_id.replace(/\s+/g, '').toUpperCase().trim();
        // 4a. Duplicate Checks
        const phoneExists = await this.checkPhone(countryCode, phoneNumber);
        if (phoneExists) {
            throw { field: 'phone_number', message: 'This phone number is already registered.' };
        }
        const aadhaarExists = await this.checkAadhaar(aadhaarClean);
        if (aadhaarExists) {
            throw { field: 'aadhaar_number', message: 'This Aadhaar number is already registered.' };
        }
        const voterExists = await this.checkVoterId(voterIdClean);
        if (voterExists) {
            throw { field: 'voter_id', message: 'This Voter ID is already registered.' };
        }
        // 4b. Profile Photo Path
        let profileImagePath = null;
        if (profileFile) {
            profileImagePath = `/uploads/profiles/${profileFile.filename}`;
        }
        // 4c. Password Hashing & Security Encryptions
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const aadhaarHash = (0, security_1.hashSensitiveData)(aadhaarClean);
        const voterIdHash = (0, security_1.hashSensitiveData)(voterIdClean);
        const aadhaarEncrypted = (0, security_1.encryptData)(aadhaarClean);
        const voterIdEncrypted = (0, security_1.encryptData)(voterIdClean);
        // 4d. Fetch Parliament Code for Member ID Generation
        let parliamentCode = 'TN';
        if (data.parliament_constituency_id) {
            const [parlRows] = await db.query(`SELECT code FROM parliament_constituencies WHERE id = ?`, [data.parliament_constituency_id]);
            if (parlRows.length > 0 && parlRows[0].code) {
                parliamentCode = parlRows[0].code;
            }
        }
        // 4e. Start MySQL Transaction
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            // Step 1: Create User
            const [userResult] = await conn.query(`INSERT INTO users (email, country_code, phone_number, password_hash, status) VALUES (?, ?, ?, ?, 'ACTIVE')`, [email, countryCode, phoneNumber, passwordHash]);
            const userId = userResult.insertId;
            // Step 2: Assign Role (Default = 1 Member unless specified)
            const roleId = Number(data.role_id) || 1;
            await conn.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleId]);
            // Step 3: Generate Unique Member ID
            const memberIdCode = (0, generateMemberId_1.generateMemberId)(userId, parliamentCode);
            // Step 4: Insert Member Record
            const [memberResult] = await conn.query(`INSERT INTO members (
          user_id, member_id, full_name, father_name, date_of_birth, gender,
          country_code, phone_number, email, profile_image, blood_group,
          aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash,
          state_id, parliament_constituency_id, assembly_constituency_id,
          district_id, block_id, village_id, address_line1, village_custom, role_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`, [
                userId,
                memberIdCode,
                data.full_name.trim(),
                data.father_name.trim(),
                data.date_of_birth,
                data.gender,
                countryCode,
                phoneNumber,
                email,
                profileImagePath,
                data.blood_group || 'Unknown',
                aadhaarEncrypted,
                voterIdEncrypted,
                aadhaarHash,
                voterIdHash,
                data.state_id || 1,
                data.parliament_constituency_id,
                data.assembly_constituency_id || null,
                data.district_id,
                data.block_id,
                data.village_id || null,
                data.address_line1 || null,
                data.village_custom || null,
                roleId
            ]);
            const memberDbId = memberResult.insertId;
            // Step 5: Generate Secure Verification QR Token & Record
            const verificationToken = `TOKEN-${crypto_1.default.randomBytes(16).toString('hex').toUpperCase()}`;
            await conn.query(`INSERT INTO member_qr_codes (member_id, verification_token) VALUES (?, ?)`, [memberDbId, verificationToken]);
            // Step 6: Commit Transaction
            await conn.commit();
            conn.release();
            // Return Created Member Response Object
            return {
                id: memberDbId,
                user_id: userId,
                member_id: memberIdCode,
                full_name: data.full_name,
                country_code: countryCode,
                phone_number: phoneNumber,
                email: email,
                verification_token: verificationToken,
                status: 'APPROVED'
            };
        }
        catch (err) {
            await conn.rollback();
            conn.release();
            throw err;
        }
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
        FROM member_qr_codes qr
        JOIN members m ON qr.member_id = m.id
        LEFT JOIN parliament_constituencies pc ON m.parliament_constituency_id = pc.id
        LEFT JOIN assembly_constituencies ac ON m.assembly_constituency_id = ac.id
        LEFT JOIN districts d ON m.district_id = d.id
        LEFT JOIN blocks b ON m.block_id = b.id
        LEFT JOIN villages v ON m.village_id = v.id
        LEFT JOIN roles r ON m.role_id = r.id
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
            const [rows] = await db.query(`SELECT 
          m.*, qr.verification_token,
          pc.name_en as parliament_name, pc.code as parliament_code,
          ac.name_en as assembly_name,
          d.name_en as district_name,
          b.name_en as block_name,
          r.name as role_name
        FROM members m
        LEFT JOIN member_qr_codes qr ON m.id = qr.member_id
        LEFT JOIN parliament_constituencies pc ON m.parliament_constituency_id = pc.id
        LEFT JOIN assembly_constituencies ac ON m.assembly_constituency_id = ac.id
        LEFT JOIN districts d ON m.district_id = d.id
        LEFT JOIN blocks b ON m.block_id = b.id
        LEFT JOIN roles r ON m.role_id = r.id
        WHERE m.member_id = ? OR m.id = ?`, [memberIdOrDbId, memberIdOrDbId]);
            if (rows.length === 0)
                return null;
            return rows[0];
        }
        return null;
    }
    // Standard List & Filter Members (Admin Panel)
    static async getMembers(filters = {}) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            let query = `
        SELECT m.id, m.member_id, m.full_name, m.email, m.country_code, m.phone_number, m.blood_group, m.status, m.created_at,
               d.name_en as district_name, d.name_ta as district_name_ta,
               b.name_en as block_name, b.name_ta as block_name_ta,
               pc.name_en as parliament_name, pc.name_ta as parliament_name_ta, pc.code as parliament_code,
               r.name as role_name
        FROM members m
        LEFT JOIN districts d ON m.district_id = d.id
        LEFT JOIN blocks b ON m.block_id = b.id
        LEFT JOIN parliament_constituencies pc ON m.parliament_constituency_id = pc.id
        LEFT JOIN roles r ON m.role_id = r.id
        WHERE 1=1
      `;
            const params = [];
            if (filters.status) {
                query += ' AND m.status = ?';
                params.push(filters.status);
            }
            if (filters.parliament_id) {
                query += ' AND m.parliament_constituency_id = ?';
                params.push(filters.parliament_id);
            }
            if (filters.district_id) {
                query += ' AND m.district_id = ?';
                params.push(filters.district_id);
            }
            if (filters.block_id) {
                query += ' AND m.block_id = ?';
                params.push(filters.block_id);
            }
            if (filters.role_id) {
                query += ' AND m.role_id = ?';
                params.push(filters.role_id);
            }
            if (filters.search) {
                query += ' AND (m.full_name LIKE ? OR m.member_id LIKE ? OR m.phone_number LIKE ? OR m.email LIKE ?)';
                const term = `%${filters.search}%`;
                params.push(term, term, term, term);
            }
            query += ' ORDER BY m.id DESC';
            const [rows] = await db.query(query, params);
            return rows;
        }
        return database_1.mockDbStore.members;
    }
    static async getMemberById(id) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT m.*, d.name_en as district_name, b.name_en as block_name, pc.name_en as parliament_name, r.name as role_name
         FROM members m
         LEFT JOIN districts d ON m.district_id = d.id
         LEFT JOIN blocks b ON m.block_id = b.id
         LEFT JOIN parliament_constituencies pc ON m.parliament_constituency_id = pc.id
         LEFT JOIN roles r ON m.role_id = r.id
         WHERE m.id = ? OR m.user_id = ?`, [id, id]);
            return rows[0] || null;
        }
        return database_1.mockDbStore.members.find(m => m.id === id);
    }
    static async getMemberQr(memberDbId) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT * FROM member_qr_codes WHERE member_id = ?', [memberDbId]);
            if (rows.length === 0)
                return null;
            return rows[0];
        }
        return null;
    }
}
exports.MemberService = MemberService;
