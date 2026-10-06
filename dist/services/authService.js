"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const generateMemberId_1 = require("../functions/generateMemberId");
const security_1 = require("../utils/security");
const roles_1 = require("../utils/roles");
const accessService_1 = require("./accessService");
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_community_platform';
class AuthService {
    static async registerMember(data) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [existingUsers] = await db.query('SELECT id FROM tblUsers WHERE email = ? OR phone_number = ?', [data.email, data.phone_number]);
            if (existingUsers.length > 0) {
                throw new Error('A member with this email or mobile number is already registered.');
            }
            const aadhaarHash = (0, security_1.hashSensitiveData)(data.aadhaar_number);
            const voterIdHash = (0, security_1.hashSensitiveData)(data.voter_id);
            const [existingMembers] = await db.query('SELECT id FROM tblMembers WHERE aadhaar_hash = ? OR voter_id_hash = ?', [aadhaarHash, voterIdHash]);
            if (existingMembers.length > 0) {
                throw new Error('A member with this Aadhaar or Voter ID is already registered.');
            }
            const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            const aadhaarEncrypted = (0, security_1.encryptData)(data.aadhaar_number);
            const voterIdEncrypted = (0, security_1.encryptData)(data.voter_id);
            const conn = await db.getConnection();
            try {
                await conn.beginTransaction();
                const [userResult] = await conn.query('INSERT INTO tblUsers (email, country_code, phone_number, password_hash, status) VALUES (?, ?, ?, ?, ?)', [data.email, data.country_code || '+91', data.phone_number, passwordHash, 'ACTIVE']);
                const userId = userResult.insertId;
                const roleId = data.role_id || 1;
                await conn.query('INSERT INTO tblUser_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
                const memberIdStr = (0, generateMemberId_1.generateMemberId)(userId, 'TN');
                const [memberResult] = await conn.query(`INSERT INTO tblMembers (
            user_id, member_id, full_name, father_name, date_of_birth, gender, country_code, phone_number, email,
            profile_image, blood_group, aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash,
            state_id, parliament_constituency_id, assembly_constituency_id, district_id, block_id, village_id,
            address_line1, village_custom, role_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    userId, memberIdStr, data.full_name, data.father_name, data.date_of_birth, data.gender, data.country_code || '+91', data.phone_number, data.email,
                    data.profile_image || null, data.blood_group || 'Unknown', aadhaarEncrypted, voterIdEncrypted, aadhaarHash, voterIdHash,
                    data.state_id || 1, data.parliament_constituency_id, data.assembly_constituency_id || null, data.district_id, data.block_id, data.village_id || null,
                    data.address_line1 || null, data.village_custom || null, roleId, 'APPROVED'
                ]);
                const memberDbId = memberResult.insertId;
                await conn.commit();
                conn.release();
                return {
                    user_id: userId,
                    member_db_id: memberDbId,
                    member_id: memberIdStr,
                    status: 'APPROVED',
                    message: 'Membership registration successful.',
                };
            }
            catch (err) {
                await conn.rollback();
                conn.release();
                throw err;
            }
        }
        else {
            // Mock DB implementation (keeping it basic as user now has real DB)
            const existing = database_1.mockDbStore.users.find(u => u.email === data.email || u.mobile === data.phone_number);
            if (existing) {
                throw new Error('A member with this email or mobile number is already registered.');
            }
            const userId = database_1.mockDbStore.users.length + 1;
            const memberIdNum = database_1.mockDbStore.members.length + 1;
            const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            database_1.mockDbStore.users.push({
                id: userId,
                email: data.email,
                mobile: data.phone_number,
                password_hash: passwordHash,
                status: 'ACTIVE',
                created_at: new Date()
            });
            database_1.mockDbStore.user_roles.push({ user_id: userId, role: 'MEMBER' });
            database_1.mockDbStore.members.push({
                id: memberIdNum,
                user_id: userId,
                member_id: `001TN0000${userId}`,
                full_name: data.full_name,
                father_name: data.father_name,
                date_of_birth: data.date_of_birth,
                gender: data.gender,
                email: data.email,
                mobile: data.phone_number,
                profile_photo: data.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
                address_line1: data.address_line1,
                address_line2: null,
                village: data.village_custom || 'Village',
                taluk_id: Number(data.block_id),
                district_id: Number(data.district_id),
                state: 'Tamil Nadu',
                pincode: '123456',
                membership_type_id: 1,
                unit_id: 1,
                joining_date: null,
                status: 'APPROVED',
                created_at: new Date().toISOString()
            });
            return {
                user_id: userId,
                member_db_id: memberIdNum,
                member_id: `001TN0000${userId}`,
                status: 'APPROVED',
                message: 'Membership registration successful.',
            };
        }
    }
    static async login(loginStr, passwordStr) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [users] = await db.query('SELECT * FROM tblUsers WHERE email = ? OR phone_number = ?', [loginStr, loginStr]);
            if (users.length === 0) {
                throw new Error('Invalid credentials');
            }
            const user = users[0];
            const isMatch = await bcryptjs_1.default.compare(passwordStr, user.password_hash);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }
            if (user.status !== 'ACTIVE') {
                throw new Error(`Account is currently ${user.status}. Please contact administrator.`);
            }
            const [rolesRows] = await db.query(`SELECT r.name FROM tblRoles r 
         JOIN tblUser_roles ur ON r.id = ur.role_id 
         WHERE ur.user_id = ?`, [user.id]);
            const roles = (0, roles_1.normalizeRoleCodes)(rolesRows.map((r) => r.name));
            const role_names = roles.map((c) => roles_1.ROLE_LABELS[c] || c);
            const pages = await accessService_1.AccessService.getPagesForRoleNames(roles);
            const [membersRows] = await db.query('SELECT * FROM tblMembers WHERE user_id = ?', [user.id]);
            const member = membersRows[0] || null;
            const token = jsonwebtoken_1.default.sign({
                id: user.id,
                email: user.email,
                mobile: user.phone_number,
                roles,
                member_id: member?.member_id || null,
            }, JWT_SECRET, { expiresIn: '7d' });
            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    mobile: user.phone_number,
                    phone_number: user.phone_number,
                    roles,
                    role_names,
                    pages,
                    member: member ? {
                        id: member.id,
                        member_id: member.member_id,
                        full_name: member.full_name,
                        status: member.status,
                        profile_photo: member.profile_image,
                        profile_image: member.profile_image,
                        district_id: member.district_id,
                        block_id: member.block_id,
                    } : null
                }
            };
        }
        else {
            const user = database_1.mockDbStore.users.find(u => u.email === loginStr || u.mobile === loginStr);
            if (!user) {
                throw new Error('Invalid credentials');
            }
            const isMatch = await bcryptjs_1.default.compare(passwordStr, user.password_hash);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }
            const userRoleEntry = database_1.mockDbStore.user_roles.filter(ur => ur.user_id === user.id);
            const roles = (0, roles_1.normalizeRoleCodes)(userRoleEntry.map(r => r.role));
            const role_names = roles.map((c) => roles_1.ROLE_LABELS[c] || c);
            const pages = await accessService_1.AccessService.getPagesForRoleNames(roles);
            const member = database_1.mockDbStore.members.find(m => m.user_id === user.id) || null;
            const token = jsonwebtoken_1.default.sign({
                id: user.id,
                email: user.email,
                mobile: user.mobile,
                roles,
                member_id: member?.member_id || null,
            }, JWT_SECRET, { expiresIn: '7d' });
            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    mobile: user.mobile,
                    phone_number: user.mobile,
                    roles,
                    role_names,
                    pages,
                    member: member ? {
                        id: member.id,
                        member_id: member.member_id,
                        full_name: member.full_name,
                        status: member.status,
                        profile_photo: member.profile_photo,
                        district_id: member.district_id,
                        taluk_id: member.taluk_id,
                        unit_id: member.unit_id
                    } : null
                }
            };
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error('Invalid session.');
        }
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            throw new Error('Database connection unavailable.');
        const [users] = await db.query('SELECT id, password_hash FROM tblUsers WHERE id = ?', [userId]);
        if (users.length === 0)
            throw new Error('Account not found.');
        const ok = await bcryptjs_1.default.compare(currentPassword, users[0].password_hash);
        if (!ok)
            throw new Error('Current password is incorrect.');
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await db.query('UPDATE tblUsers SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
        return true;
    }
    static async getSessionUser(userId) {
        const db = await (0, database_1.getDbConnection)();
        if (!db || !Number.isInteger(userId) || userId <= 0)
            return null;
        const [users] = await db.query('SELECT id, email, country_code, phone_number, status FROM tblUsers WHERE id = ?', [userId]);
        if (users.length === 0)
            return null;
        const user = users[0];
        const [rolesRows] = await db.query(`SELECT r.name FROM tblRoles r JOIN tblUser_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`, [user.id]);
        const roles = (0, roles_1.normalizeRoleCodes)(rolesRows.map((r) => r.name));
        const role_names = roles.map((c) => roles_1.ROLE_LABELS[c] || c);
        const pages = await accessService_1.AccessService.getPagesForRoleNames(roles);
        const [membersRows] = await db.query('SELECT * FROM tblMembers WHERE user_id = ?', [user.id]);
        const member = membersRows[0] || null;
        return {
            id: user.id,
            email: user.email,
            country_code: user.country_code,
            phone_number: user.phone_number,
            mobile: user.phone_number,
            status: user.status,
            roles,
            role_names,
            pages,
            member: member ? {
                id: member.id,
                member_id: member.member_id,
                full_name: member.full_name,
                status: member.status,
                profile_photo: member.profile_image,
                profile_image: member.profile_image,
                role_name: role_names[0] || null,
            } : null,
        };
    }
}
exports.AuthService = AuthService;
