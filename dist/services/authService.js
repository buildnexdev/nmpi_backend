"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.normalizePhone = normalizePhone;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const authMiddleware_1 = require("../middleware/authMiddleware");
const types_1 = require("../types");
const roles_1 = require("../utils/roles");
const accessService_1 = require("./accessService");
function normalizePhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}
class AuthService {
    static async getSessionUser(userId) {
        if (!Number.isInteger(userId) || userId <= 0)
            return null;
        const db = await (0, database_1.getDbConnection)();
        const [users] = await db.query('SELECT id, email, country_code, phone_number, status FROM tblUsers WHERE id = ?', [userId]);
        if (users.length === 0)
            return null;
        const user = users[0];
        const [roleRows] = await db.query('SELECT r.name FROM tblRoles r JOIN tblUser_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?', [userId]);
        const roleNames = roleRows.map((r) => r.name);
        const roles = (0, roles_1.normalizeRoleCodes)(roleNames);
        const role_names = roles.map((c) => roles_1.ROLE_LABELS[c] || c);
        const pages = await accessService_1.AccessService.getPagesForRoleNames(roles);
        const [memberRows] = await db.query(`SELECT m.id, m.member_id, m.full_name, m.status, m.profile_image, m.district_id, m.block_id, m.village_id, r.name AS role_name
       FROM tblMembers m LEFT JOIN tblRoles r ON m.role_id = r.id
       WHERE m.user_id = ?`, [userId]);
        const member = memberRows[0] || null;
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
            member: member
                ? {
                    id: member.id,
                    member_id: member.member_id,
                    full_name: member.full_name,
                    status: member.status,
                    profile_photo: member.profile_image,
                    profile_image: member.profile_image,
                    role_name: member.role_name || role_names[0] || null,
                    district_id: member.district_id,
                    block_id: member.block_id,
                    village_id: member.village_id,
                }
                : null,
        };
    }
    static async login(loginStr, passwordStr) {
        const db = await (0, database_1.getDbConnection)();
        const login = String(loginStr || '').trim();
        const phone = normalizePhone(login);
        const [users] = await db.query("SELECT id, password_hash, status FROM tblUsers WHERE email = ? OR (? <> '' AND phone_number = ?) LIMIT 1", [login.toLowerCase(), phone, phone]);
        const user = users[0];
        let isMatch = false;
        if (user) {
            const stored = String(user.password_hash || '');
            if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
                isMatch = await bcryptjs_1.default.compare(passwordStr, stored);
            }
            else if (stored.length > 0) {
                // Legacy imports sometimes stored plain text; upgrade to bcrypt on successful login.
                isMatch = passwordStr === stored;
                if (isMatch) {
                    const upgraded = await bcryptjs_1.default.hash(passwordStr, 10);
                    await db.query('UPDATE tblUsers SET password_hash = ? WHERE id = ?', [upgraded, user.id]);
                }
            }
        }
        if (!user || !isMatch) {
            throw new types_1.HttpError(401, 'Invalid email/phone or password', 'INVALID_CREDENTIALS');
        }
        if (user.status !== 'ACTIVE') {
            throw new types_1.HttpError(403, `Your account is ${user.status.toLowerCase()}. Please contact the administrator.`, 'ACCOUNT_INACTIVE');
        }
        const sessionUser = await this.getSessionUser(user.id);
        if (!sessionUser) {
            throw new types_1.HttpError(401, 'Invalid email/phone or password', 'INVALID_CREDENTIALS');
        }
        const token = jsonwebtoken_1.default.sign({
            id: sessionUser.id,
            email: sessionUser.email,
            roles: sessionUser.roles,
            member_db_id: sessionUser.member?.id || null,
        }, authMiddleware_1.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
        return { token, user: sessionUser };
    }
    static async changePassword(userId, currentPassword, newPassword) {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new types_1.HttpError(401, 'Invalid session.', 'UNAUTHORIZED');
        }
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT password_hash FROM tblUsers WHERE id = ?', [userId]);
        if (rows.length === 0)
            throw new types_1.HttpError(404, 'User not found', 'NOT_FOUND');
        const ok = await bcryptjs_1.default.compare(currentPassword, rows[0].password_hash);
        if (!ok)
            throw new types_1.HttpError(400, 'Current password is incorrect', 'VALIDATION_ERROR', { field: 'current_password' });
        const hash = await bcryptjs_1.default.hash(newPassword, 10);
        await db.query('UPDATE tblUsers SET password_hash = ? WHERE id = ?', [hash, userId]);
    }
}
exports.AuthService = AuthService;
