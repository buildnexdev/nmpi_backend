import { getDbConnection, mockDbStore } from '../config/database';
import { generateMemberId } from '../functions/generateMemberId';
import { generateQrToken } from '../functions/generateQrToken';
import { saveMemberQrImage, generateMemberQrDataUrl } from '../utils/qrCodeGenerator';

export class MemberService {
  static async getMembers(filters: any = {}) {
    const db = await getDbConnection();
    if (db) {
      let query = `
        SELECT m.*, d.name as district_name, t.name as taluk_name, u.name as unit_name, mt.name as membership_type_name
        FROM members m
        LEFT JOIN districts d ON m.district_id = d.id
        LEFT JOIN taluks t ON m.taluk_id = t.id
        LEFT JOIN units u ON m.unit_id = u.id
        LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters.status) {
        query += ' AND m.status = ?';
        params.push(filters.status);
      }
      if (filters.district_id) {
        query += ' AND m.district_id = ?';
        params.push(filters.district_id);
      }
      if (filters.taluk_id) {
        query += ' AND m.taluk_id = ?';
        params.push(filters.taluk_id);
      }
      if (filters.unit_id) {
        query += ' AND m.unit_id = ?';
        params.push(filters.unit_id);
      }
      if (filters.search) {
        query += ' AND (m.full_name LIKE ? OR m.member_id LIKE ? OR m.mobile LIKE ? OR m.email LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY m.id DESC';

      const [rows]: any = await db.query(query, params);
      return rows;
    } else {
      let list = mockDbStore.members.map(m => {
        const d = mockDbStore.districts.find(d => d.id === m.district_id);
        const t = mockDbStore.taluks.find(t => t.id === m.taluk_id);
        const u = mockDbStore.units.find(u => u.id === m.unit_id);
        const mt = mockDbStore.membership_types.find(mt => mt.id === m.membership_type_id);
        return {
          ...m,
          district_name: d?.name || 'District',
          taluk_name: t?.name || 'Taluk',
          unit_name: u?.name || 'Unit',
          membership_type_name: mt?.name || 'Regular'
        };
      });

      if (filters.status) {
        list = list.filter(m => m.status === filters.status);
      }
      if (filters.district_id) {
        list = list.filter(m => m.district_id === Number(filters.district_id));
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        list = list.filter(m =>
          m.full_name.toLowerCase().includes(term) ||
          (m.member_id && m.member_id.toLowerCase().includes(term)) ||
          m.mobile.includes(term)
        );
      }
      return list;
    }
  }

  static async getMemberById(id: number) {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query(
        `SELECT m.*, d.name as district_name, t.name as taluk_name, u.name as unit_name, mt.name as membership_type_name
         FROM members m
         LEFT JOIN districts d ON m.district_id = d.id
         LEFT JOIN taluks t ON m.taluk_id = t.id
         LEFT JOIN units u ON m.unit_id = u.id
         LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
         WHERE m.id = ? OR m.user_id = ?`,
        [id, id]
      );
      return rows[0] || null;
    } else {
      const m = mockDbStore.members.find(mem => mem.id === Number(id) || mem.user_id === Number(id));
      if (!m) return null;
      const d = mockDbStore.districts.find(d => d.id === m.district_id);
      const t = mockDbStore.taluks.find(t => t.id === m.taluk_id);
      const u = mockDbStore.units.find(u => u.id === m.unit_id);
      const mt = mockDbStore.membership_types.find(mt => mt.id === m.membership_type_id);
      return {
        ...m,
        district_name: d?.name || 'District',
        taluk_name: t?.name || 'Taluk',
        unit_name: u?.name || 'Unit',
        membership_type_name: mt?.name || 'Regular'
      };
    }
  }

  static async updateStatus(id: number, status: string, adminUserId?: number) {
    const db = await getDbConnection();

    let newMemberId: string | null = null;
    let qrTokenStr: string | null = null;

    if (status === 'APPROVED') {
      newMemberId = generateMemberId(id);
      qrTokenStr = generateQrToken();
      await saveMemberQrImage(qrTokenStr, newMemberId);
    }

    if (db) {
      if (status === 'APPROVED') {
        await db.query(
          'UPDATE members SET status = ?, member_id = ?, joining_date = CURDATE() WHERE id = ?',
          [status, newMemberId, id]
        );
        await db.query(
          `INSERT INTO member_qr_codes (member_id, verification_token, qr_image_path)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE verification_token = VALUES(verification_token), qr_image_path = VALUES(qr_image_path)`,
          [id, qrTokenStr, `uploads/qr/qr_${newMemberId?.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`]
        );
      } else {
        await db.query('UPDATE members SET status = ? WHERE id = ?', [status, id]);
      }
      return { id, status, member_id: newMemberId };
    } else {
      const index = mockDbStore.members.findIndex(m => m.id === Number(id));
      if (index !== -1) {
        mockDbStore.members[index].status = status as any;
        if (status === 'APPROVED') {
          mockDbStore.members[index].member_id = newMemberId as any;
          mockDbStore.members[index].joining_date = new Date().toISOString().split('T')[0];
          
          const qrIndex = mockDbStore.member_qr_codes.findIndex(q => q.member_id === Number(id));
          const qrObj = {
            id: mockDbStore.member_qr_codes.length + 1,
            member_id: Number(id),
            verification_token: qrTokenStr!,
            qr_image_path: `uploads/qr/qr_${newMemberId?.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`,
            issued_at: new Date().toISOString()
          };
          if (qrIndex !== -1) mockDbStore.member_qr_codes[qrIndex] = qrObj;
          else mockDbStore.member_qr_codes.push(qrObj);
        }
      }
      return { id, status, member_id: newMemberId };
    }
  }

  static async updateMemberStatus(id: number, status: string, adminUserId?: number) {
    return MemberService.updateStatus(id, status, adminUserId);
  }

  static async getMemberQr(memberDbId: number) {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query(
        'SELECT * FROM member_qr_codes WHERE member_id = ?',
        [memberDbId]
      );
      if (rows.length === 0) return null;
      const qrDataUrl = await generateMemberQrDataUrl(rows[0].verification_token);
      return {
        ...rows[0],
        qr_data_url: qrDataUrl,
      };
    } else {
      const qrObj = mockDbStore.member_qr_codes.find(q => q.member_id === Number(memberDbId));
      if (!qrObj) return null;
      const qrDataUrl = await generateMemberQrDataUrl(qrObj.verification_token);
      return {
        ...qrObj,
        qr_data_url: qrDataUrl,
      };
    }
  }
}
