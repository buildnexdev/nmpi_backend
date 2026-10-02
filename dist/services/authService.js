"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_community_platform';
class AuthService {
    static async registerMember(data) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ? OR mobile = ?', [data.email, data.mobile]);
            if (existingUsers.length > 0) {
                throw new Error('A member with this email or mobile number is already registered.');
            }
            const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            const conn = await db.getConnection();
            try {
                await conn.beginTransaction();
                const [userResult] = await conn.query('INSERT INTO users (email, mobile, password_hash, status) VALUES (?, ?, ?, ?)', [data.email, data.mobile, passwordHash, 'ACTIVE']);
                const userId = userResult.insertId;
                await conn.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 6]);
                const [memberResult] = await conn.query(`INSERT INTO members (
            user_id, full_name, father_name, date_of_birth, gender, email, mobile,
            profile_photo, address_line1, address_line2, village, taluk_id, district_id,
            state, pincode, membership_type_id, unit_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    userId, data.full_name, data.father_name, data.date_of_birth, data.gender,
                    data.email, data.mobile, data.profile_photo || null, data.address_line1,
                    data.address_line2 || null, data.village, data.taluk_id, data.district_id,
                    data.state || 'State', data.pincode, data.membership_type_id, data.unit_id, 'PENDING'
                ]);
                const memberIdNum = memberResult.insertId;
                const appNumber = `APP-${Date.now()}-${memberIdNum}`;
                await conn.query('INSERT INTO membership_applications (member_id, application_number, status) VALUES (?, ?, ?)', [memberIdNum, appNumber, 'PENDING']);
                await conn.commit();
                conn.release();
                return {
                    user_id: userId,
                    member_db_id: memberIdNum,
                    application_number: appNumber,
                    status: 'PENDING',
                    message: 'Membership application submitted successfully and is pending admin approval.',
                };
            }
            catch (err) {
                await conn.rollback();
                conn.release();
                throw err;
            }
        }
        else {
            const existing = database_1.mockDbStore.users.find(u => u.email === data.email || u.mobile === data.mobile);
            if (existing) {
                throw new Error('A member with this email or mobile number is already registered.');
            }
            const userId = database_1.mockDbStore.users.length + 1;
            const memberIdNum = database_1.mockDbStore.members.length + 1;
            const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            database_1.mockDbStore.users.push({
                id: userId,
                email: data.email,
                mobile: data.mobile,
                password_hash: passwordHash,
                status: 'ACTIVE',
                created_at: new Date()
            });
            database_1.mockDbStore.user_roles.push({ user_id: userId, role: 'MEMBER' });
            database_1.mockDbStore.members.push({
                id: memberIdNum,
                user_id: userId,
                member_id: null,
                full_name: data.full_name,
                father_name: data.father_name,
                date_of_birth: data.date_of_birth,
                gender: data.gender,
                email: data.email,
                mobile: data.mobile,
                profile_photo: data.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
                address_line1: data.address_line1,
                address_line2: data.address_line2 || null,
                village: data.village,
                taluk_id: Number(data.taluk_id),
                district_id: Number(data.district_id),
                state: data.state || 'State',
                pincode: data.pincode,
                membership_type_id: Number(data.membership_type_id),
                unit_id: Number(data.unit_id),
                joining_date: null,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            return {
                user_id: userId,
                member_db_id: memberIdNum,
                application_number: `APP-${Date.now()}-${memberIdNum}`,
                status: 'PENDING',
                message: 'Membership application submitted successfully and is pending admin approval.',
            };
        }
    }
    static async login(loginStr, passwordStr) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [users] = await db.query('SELECT * FROM users WHERE email = ? OR mobile = ?', [loginStr, loginStr]);
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
            const [rolesRows] = await db.query(`SELECT r.name FROM roles r 
         JOIN user_roles ur ON r.id = ur.role_id 
         WHERE ur.user_id = ?`, [user.id]);
            const roles = rolesRows.map((r) => r.name);
            const [membersRows] = await db.query('SELECT * FROM members WHERE user_id = ?', [user.id]);
            const member = membersRows[0] || null;
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
                    roles,
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
            const roles = userRoleEntry.map(r => r.role);
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
                    roles,
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
}
exports.AuthService = AuthService;
