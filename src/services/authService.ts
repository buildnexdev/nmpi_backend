import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbConnection } from '../config/database';
import { JWT_SECRET } from '../middleware/authMiddleware';
import { HttpError } from '../types';
import { normalizeRoleCodes, ROLE_LABELS } from '../utils/roles';
import { AccessService } from './accessService';

export function normalizePhone(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

export class AuthService {
  static async getSessionUser(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) return null;
    const db = await getDbConnection();
    const [users]: any = await db.query(
      'SELECT id, email, country_code, phone_number, status FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) return null;
    const user = users[0];

    const [roleRows]: any = await db.query(
      'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?',
      [userId]
    );
    const roleNames: string[] = roleRows.map((r: any) => r.name);
    const roles = normalizeRoleCodes(roleNames);
    const role_names = roles.map((c) => ROLE_LABELS[c] || c);
    const pages = await AccessService.getPagesForRoleNames(roles);

    const [memberRows]: any = await db.query(
      `SELECT m.id, m.member_id, m.full_name, m.status, m.profile_image, m.district_id, m.block_id, m.village_id, r.name AS role_name
       FROM members m LEFT JOIN roles r ON m.role_id = r.id
       WHERE m.user_id = ?`,
      [userId]
    );
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

  static async login(loginStr: string, passwordStr: string) {
    const db = await getDbConnection();
    const login = String(loginStr || '').trim();
    const phone = normalizePhone(login);

    const [users]: any = await db.query(
      "SELECT id, password_hash, status FROM users WHERE email = ? OR (? <> '' AND phone_number = ?) LIMIT 1",
      [login.toLowerCase(), phone, phone]
    );

    const user = users[0];
    const isMatch = user ? await bcrypt.compare(passwordStr, user.password_hash) : false;
    if (!user || !isMatch) {
      throw new HttpError(401, 'Invalid email/phone or password', 'INVALID_CREDENTIALS');
    }
    if (user.status !== 'ACTIVE') {
      throw new HttpError(403, `Your account is ${user.status.toLowerCase()}. Please contact the administrator.`, 'ACCOUNT_INACTIVE');
    }

    const sessionUser = await this.getSessionUser(user.id);
    if (!sessionUser) {
      throw new HttpError(401, 'Invalid email/phone or password', 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      {
        id: sessionUser.id,
        email: sessionUser.email,
        roles: sessionUser.roles,
        member_db_id: sessionUser.member?.id || null,
      },
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    return { token, user: sessionUser };
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new HttpError(401, 'Invalid session.', 'UNAUTHORIZED');
    }
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) throw new HttpError(404, 'User not found', 'NOT_FOUND');

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) throw new HttpError(400, 'Current password is incorrect', 'VALIDATION_ERROR', { field: 'current_password' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
  }
}
