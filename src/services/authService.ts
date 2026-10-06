import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbConnection, mockDbStore } from '../config/database';
import { generateMemberId } from '../functions/generateMemberId';
import { encryptData, hashSensitiveData } from '../utils/security';
import { normalizeRoleCodes, ROLE_LABELS } from '../utils/roles';
import { AccessService } from './accessService';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_community_platform';

export class AuthService {
  static async registerMember(data: any) {
    const db = await getDbConnection();
    
    if (db) {
      const [existingUsers]: any = await db.query(
        'SELECT id FROM tblUsers WHERE email = ? OR phone_number = ?',
        [data.email, data.phone_number]
      );
      if (existingUsers.length > 0) {
        throw new Error('A member with this email or mobile number is already registered.');
      }

      const aadhaarHash = hashSensitiveData(data.aadhaar_number);
      const voterIdHash = hashSensitiveData(data.voter_id);

      const [existingMembers]: any = await db.query(
        'SELECT id FROM tblMembers WHERE aadhaar_hash = ? OR voter_id_hash = ?',
        [aadhaarHash, voterIdHash]
      );
      if (existingMembers.length > 0) {
        throw new Error('A member with this Aadhaar or Voter ID is already registered.');
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const aadhaarEncrypted = encryptData(data.aadhaar_number);
      const voterIdEncrypted = encryptData(data.voter_id);
      
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [userResult]: any = await conn.query(
          'INSERT INTO tblUsers (email, country_code, phone_number, password_hash, status) VALUES (?, ?, ?, ?, ?)',
          [data.email, data.country_code || '+91', data.phone_number, passwordHash, 'ACTIVE']
        );
        const userId = userResult.insertId;

        const roleId = data.role_id || 1;
        await conn.query('INSERT INTO tblUser_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);

        const memberIdStr = generateMemberId(userId, 'TN');

        const [memberResult]: any = await conn.query(
          `INSERT INTO tblMembers (
            user_id, member_id, full_name, father_name, date_of_birth, gender, country_code, phone_number, email,
            profile_image, blood_group, aadhaar_number_encrypted, voter_id_encrypted, aadhaar_hash, voter_id_hash,
            state_id, parliament_constituency_id, assembly_constituency_id, district_id, block_id, village_id,
            address_line1, village_custom, role_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, memberIdStr, data.full_name, data.father_name, data.date_of_birth, data.gender, data.country_code || '+91', data.phone_number, data.email,
            data.profile_image || null, data.blood_group || 'Unknown', aadhaarEncrypted, voterIdEncrypted, aadhaarHash, voterIdHash,
            data.state_id || 1, data.parliament_constituency_id, data.assembly_constituency_id || null, data.district_id, data.block_id, data.village_id || null,
            data.address_line1 || null, data.village_custom || null, roleId, 'APPROVED'
          ]
        );
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
      } catch (err) {
        await conn.rollback();
        conn.release();
        throw err;
      }
    } else {
      // Mock DB implementation (keeping it basic as user now has real DB)
      const existing = mockDbStore.users.find(u => u.email === data.email || u.mobile === data.phone_number);
      if (existing) {
        throw new Error('A member with this email or mobile number is already registered.');
      }

      const userId = mockDbStore.users.length + 1;
      const memberIdNum = mockDbStore.members.length + 1;
      const passwordHash = await bcrypt.hash(data.password, 10);

      mockDbStore.users.push({
        id: userId,
        email: data.email,
        mobile: data.phone_number,
        password_hash: passwordHash,
        status: 'ACTIVE',
        created_at: new Date()
      });

      mockDbStore.user_roles.push({ user_id: userId, role: 'MEMBER' });

      mockDbStore.members.push({
        id: memberIdNum,
        user_id: userId,
        member_id: `001TN0000${userId}` as any,
        full_name: data.full_name,
        father_name: data.father_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        email: data.email,
        mobile: data.phone_number,
        profile_photo: data.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        address_line1: data.address_line1,
        address_line2: null as any,
        village: data.village_custom || 'Village',
        taluk_id: Number(data.block_id),
        district_id: Number(data.district_id),
        state: 'Tamil Nadu',
        pincode: '123456',
        membership_type_id: 1,
        unit_id: 1,
        joining_date: null as any,
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

  static async login(loginStr: string, passwordStr: string) {
    const db = await getDbConnection();

    if (db) {
      const [users]: any = await db.query(
        'SELECT * FROM tblUsers WHERE email = ? OR phone_number = ?',
        [loginStr, loginStr]
      );

      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(passwordStr, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error(`Account is currently ${user.status}. Please contact administrator.`);
      }

      const [rolesRows]: any = await db.query(
        `SELECT r.name FROM tblRoles r 
         JOIN tblUser_roles ur ON r.id = ur.role_id 
         WHERE ur.user_id = ?`,
        [user.id]
      );
      const roles = normalizeRoleCodes(rolesRows.map((r: any) => r.name));
      const role_names = roles.map((c) => ROLE_LABELS[c] || c);
      const pages = await AccessService.getPagesForRoleNames(roles);

      const [membersRows]: any = await db.query(
        'SELECT * FROM tblMembers WHERE user_id = ?',
        [user.id]
      );
      const member = membersRows[0] || null;

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          mobile: user.phone_number,
          roles,
          member_id: member?.member_id || null,
        },
        JWT_SECRET,
        { expiresIn: '7d' as any }
      );

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
    } else {
      const user = mockDbStore.users.find(u => u.email === loginStr || u.mobile === loginStr);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(passwordStr, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      const userRoleEntry = mockDbStore.user_roles.filter(ur => ur.user_id === user.id);
      const roles = normalizeRoleCodes(userRoleEntry.map(r => r.role));
      const role_names = roles.map((c) => ROLE_LABELS[c] || c);
      const pages = await AccessService.getPagesForRoleNames(roles);
      const member = mockDbStore.members.find(m => m.user_id === user.id) || null;

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          roles,
          member_id: member?.member_id || null,
        },
        JWT_SECRET,
        { expiresIn: '7d' as any }
      );

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

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid session.');
    }
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');

    const [users]: any = await db.query('SELECT id, password_hash FROM tblUsers WHERE id = ?', [userId]);
    if (users.length === 0) throw new Error('Account not found.');

    const ok = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!ok) throw new Error('Current password is incorrect.');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE tblUsers SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    return true;
  }

  static async getSessionUser(userId: number) {
    const db = await getDbConnection();
    if (!db || !Number.isInteger(userId) || userId <= 0) return null;
    const [users]: any = await db.query('SELECT id, email, country_code, phone_number, status FROM tblUsers WHERE id = ?', [userId]);
    if (users.length === 0) return null;
    const user = users[0];
    const [rolesRows]: any = await db.query(
      `SELECT r.name FROM tblRoles r JOIN tblUser_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [user.id]
    );
    const roles = normalizeRoleCodes(rolesRows.map((r: any) => r.name));
    const role_names = roles.map((c) => ROLE_LABELS[c] || c);
    const pages = await AccessService.getPagesForRoleNames(roles);
    const [membersRows]: any = await db.query('SELECT * FROM tblMembers WHERE user_id = ?', [user.id]);
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
