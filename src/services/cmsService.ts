import fs from 'fs';
import path from 'path';
import { getDbConnection } from '../config/database';
import { HttpError } from '../types';
import { requireFields, pickOptional, oneOf } from '../utils/content';
import { UPLOADS_ROOT, ALLOWED_IMAGE_EXTENSIONS } from '../middleware/uploadMiddleware';

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
    const [rows]: any = await db.query(
      `SELECT * FROM tblLeaders ${includeInactive ? '' : "WHERE status = 'ACTIVE'"} ORDER BY display_order ASC, id ASC`
    );
    return rows;
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

  static listUploads(baseUrl: string) {
    if (!fs.existsSync(UPLOADS_ROOT)) return [];
    return fs
      .readdirSync(UPLOADS_ROOT)
      .filter((file) => ALLOWED_IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()) || path.extname(file).toLowerCase() === '.gif')
      .map((file) => {
        const stats = fs.statSync(path.join(UPLOADS_ROOT, file));
        return {
          filename: file,
          path: `/uploads/${encodeURIComponent(file)}`,
          url: `${baseUrl}/uploads/${encodeURIComponent(file)}`,
          size: stats.size,
          updated_at: stats.mtime,
        };
      })
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
  }

  static deleteUpload(filename: string) {
    const safeName = path.basename(filename);
    const target = path.join(UPLOADS_ROOT, safeName);
    if (safeName !== filename || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      throw new HttpError(404, 'File not found', 'NOT_FOUND');
    }
    fs.unlinkSync(target);
  }
}
