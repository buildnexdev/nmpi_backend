import { getDbConnection, mockDbStore } from '../config/database';

export class VerificationService {
  /**
   * Safe public verification endpoint for QR scans.
   * Returns NON-SENSITIVE member profile info only!
   * NEVER exposes PII like address, mobile, father's name, or email.
   */
  static async verifyToken(token: string) {
    const db = await getDbConnection();

    if (db) {
      const [rows]: any = await db.query(
        `SELECT m.full_name, m.member_id, m.status, m.created_at as joining_date, m.profile_image as profile_photo,
                d.name_en as district_name, b.name_en as taluk_name, v.name_en as unit_name, r.name as membership_type_name
         FROM tblMember_qr_codes qr
         JOIN tblMembers m ON qr.member_id = m.id
         LEFT JOIN tblDistricts d ON m.district_id = d.id
         LEFT JOIN tblBlocks b ON m.block_id = b.id
         LEFT JOIN tblVillages v ON m.village_id = v.id
         LEFT JOIN tblRoles r ON m.role_id = r.id
         WHERE qr.verification_token = ?`,
        [token]
      );

      if (rows.length === 0) {
        return {
          verified: false,
          message: 'Invalid or unrecognized QR token.',
          member: null,
        };
      }

      const m = rows[0];
      return {
        verified: true,
        message: 'Member identity verified successfully.',
        member: {
          full_name: m.full_name,
          member_id: m.member_id,
          status: m.status,
          joining_date: m.joining_date,
          profile_photo: m.profile_photo,
          district_name: m.district_name,
          taluk_name: m.taluk_name,
          unit_name: m.unit_name,
          membership_type_name: m.membership_type_name,
        },
      };
    } else {
      const qrObj = mockDbStore.member_qr_codes.find(q => q.verification_token === token);
      if (!qrObj) {
        return {
          verified: false,
          message: 'Invalid or unrecognized QR token.',
          member: null,
        };
      }

      const m = mockDbStore.members.find(mem => mem.id === qrObj.member_id);
      if (!m) {
        return { verified: false, message: 'Member record not found.', member: null };
      }

      const d = mockDbStore.districts.find(d => d.id === m.district_id);
      const t = mockDbStore.taluks.find(t => t.id === m.taluk_id);
      const u = mockDbStore.units.find(u => u.id === m.unit_id);
      const mt = mockDbStore.membership_types.find(mt => mt.id === m.membership_type_id);

      return {
        verified: true,
        message: 'Member identity verified successfully.',
        member: {
          full_name: m.full_name,
          member_id: m.member_id,
          status: m.status,
          joining_date: m.joining_date,
          profile_photo: m.profile_photo,
          district_name: d?.name || 'Central District',
          taluk_name: t?.name || 'Central Taluk',
          unit_name: u?.name || 'Unit 01',
          membership_type_name: mt?.name || 'Life Member',
        },
      };
    }
  }
}
