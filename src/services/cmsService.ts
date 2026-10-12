import { getDbConnection } from '../config/database';
import { HttpError } from '../types';
import { requireFields, pickOptional, oneOf } from '../utils/content';

const LEADER_FIELDS = ['name_ta', 'designation_ta', 'district', 'district_ta', 'qualification', 'photo_url', 'phone', 'email', 'bio'];
const PAGE_KEY_PATTERN = /^[a-z0-9_-]{2,50}$/;

export class CmsService {
  static async getPublicStats() {
    const db = await getDbConnection();
    const [[members]]: any = await db.query("SELECT COUNT(*) AS c, COUNT(DISTINCT district_id) AS d FROM tblMembers WHERE status = 'APPROVED'");
    const [[leaders]]: any = await db.query("SELECT COUNT(*) AS c FROM tblLeaders WHERE status = 'ACTIVE'");
    const [[districts]]: any = await db.query('SELECT COUNT(*) AS c FROM tblDistricts');
    const [[events]]: any = await db.query("SELECT COUNT(*) AS c FROM tblEvents WHERE status IN ('UPCOMING','ONGOING') AND event_date >= CURDATE()");
    return {
      members: Number(members.c) || 0,
      member_districts: Number(members.d) || 0,
      leaders: Number(leaders.c) || 0,
      districts: Number(districts.c) || 0,
      upcoming_events: Number(events.c) || 0,
    };
  }

  static async listLeaders(includeInactive: boolean) {
    const db = await getDbConnection();
    const [leaders]: any = await db.query(
      `SELECT *, 0 AS is_live_member FROM tblLeaders ${includeInactive ? '' : "WHERE status = 'ACTIVE'"} ORDER BY display_order ASC, id ASC`
    );

    try {
      const [members]: any = await db.query(`
        SELECT 
          (100000 + m.id) AS id,
          m.id AS member_pk,
          m.member_id,
          m.full_name AS name,
          m.full_name AS name_ta,
          COALESCE(NULLIF(TRIM(m.designation), ''), r.name, 'Member') AS designation,
          COALESCE(NULLIF(TRIM(m.designation), ''), r.name, 'உறுப்பினர்') AS designation_ta,
          COALESCE(d.name_en, '') AS district,
          COALESCE(d.name_ta, d.name_en, '') AS district_ta,
          NULL AS qualification,
          m.profile_image AS photo_url,
          m.phone_number AS phone,
          m.email,
          NULL AS bio,
          999 AS display_order,
          ${includeInactive ? 'm.status' : "'ACTIVE'"} AS status,
          1 AS is_live_member
        FROM tblMembers m
        LEFT JOIN tblDistricts d ON m.district_id = d.id
        LEFT JOIN tblRoles r ON m.role_id = r.id
        WHERE ${includeInactive ? "m.status IN ('APPROVED', 'PENDING')" : "m.status = 'APPROVED'"}
          AND (
            (m.designation IS NOT NULL AND TRIM(m.designation) != '' AND LOWER(TRIM(m.designation)) NOT IN ('member', 'உறுப்பினர்'))
            OR m.role_id IN (3, 4, 5, 6, 7)
          )
        ORDER BY m.id DESC
      `);
      return [...leaders, ...members];
    } catch (err) {
      console.warn('Could not query members for leadership list:', err);
      return leaders;
    }
  }

  static async getLeader(id: number) {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async saveLeader(data: any, id?: number) {
    const existing = id ? await this.getLeader(id) : null;
    if (id && !existing) throw new HttpError(404, 'Leader not found', 'NOT_FOUND');
    const merged = { ...(existing || {}), ...data };
    requireFields(merged, [['name', 'Name'], ['designation', 'Designation']]);

    const values = [
      String(merged.name).trim(),
      String(merged.designation).trim(),
      ...LEADER_FIELDS.map((f) => pickOptional(merged, f)),
      Number(merged.display_order) || 0,
      oneOf(merged.status, ['ACTIVE', 'INACTIVE'] as const, 'ACTIVE'),
    ];

    const db = await getDbConnection();
    if (id) {
      await db.query(
        `UPDATE tblLeaders SET name = ?, designation = ?, ${LEADER_FIELDS.map((f) => `${f} = ?`).join(', ')}, display_order = ?, status = ? WHERE id = ?`,
        [...values, id]
      );
      return this.getLeader(id);
    }
    const [res]: any = await db.query(
      `INSERT INTO tblLeaders (name, designation, ${LEADER_FIELDS.join(', ')}, display_order, status)
       VALUES (${new Array(values.length).fill('?').join(', ')})`,
      values
    );
    return this.getLeader(res.insertId);
  }

  static async deleteLeader(id: number) {
    const db = await getDbConnection();
    const [res]: any = await db.query('DELETE FROM tblLeaders WHERE id = ?', [id]);
    if (res.affectedRows === 0) throw new HttpError(404, 'Leader not found', 'NOT_FOUND');
  }

  static async listPages() {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT * FROM tblOrganization_pages ORDER BY page_key ASC');
    return rows;
  }

  static async getPage(pageKey: string) {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT * FROM tblOrganization_pages WHERE page_key = ?', [pageKey]);
    return rows[0] || null;
  }

  static async savePage(pageKey: string, data: any) {
    if (!PAGE_KEY_PATTERN.test(pageKey)) {
      throw new HttpError(400, 'Page key may only contain lowercase letters, numbers, - and _', 'VALIDATION_ERROR', { field: 'page_key' });
    }
    requireFields(data, [['title', 'Title'], ['content', 'Content']]);
    const db = await getDbConnection();
    await db.query(
      `INSERT INTO tblOrganization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), title_ta = VALUES(title_ta), content = VALUES(content), content_ta = VALUES(content_ta)`,
      [pageKey, String(data.title).trim(), pickOptional(data, 'title_ta'), String(data.content), pickOptional(data, 'content_ta')]
    );
    return this.getPage(pageKey);
  }
}
