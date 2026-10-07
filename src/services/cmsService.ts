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
    const [[members]]: any = await db.query("SELECT COUNT(*) AS c, COUNT(DISTINCT district_id) AS d FROM members WHERE status = 'APPROVED'");
    const [[leaders]]: any = await db.query("SELECT COUNT(*) AS c FROM leaders WHERE status = 'ACTIVE'");
    const [[districts]]: any = await db.query('SELECT COUNT(*) AS c FROM districts');
    const [[events]]: any = await db.query("SELECT COUNT(*) AS c FROM events WHERE status IN ('UPCOMING','ONGOING') AND event_date >= CURDATE()");
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
      `SELECT * FROM leaders ${includeInactive ? '' : "WHERE status = 'ACTIVE'"} ORDER BY display_order ASC, id ASC`
    );
    return rows;
  }

  static async getLeader(id: number) {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT * FROM leaders WHERE id = ?', [id]);
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
        `UPDATE leaders SET name = ?, designation = ?, ${LEADER_FIELDS.map((f) => `${f} = ?`).join(', ')}, display_order = ?, status = ? WHERE id = ?`,
        [...values, id]
      );
      return this.getLeader(id);
    }
    const [res]: any = await db.query(
      `INSERT INTO leaders (name, designation, ${LEADER_FIELDS.join(', ')}, display_order, status)
       VALUES (${new Array(values.length).fill('?').join(', ')})`,
      values
    );
    return this.getLeader(res.insertId);
  }

  static async deleteLeader(id: number) {
    const db = await getDbConnection();
    const [res]: any = await db.query('DELETE FROM leaders WHERE id = ?', [id]);
    if (res.affectedRows === 0) throw new HttpError(404, 'Leader not found', 'NOT_FOUND');
  }

  static async listPages() {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT * FROM organization_pages ORDER BY page_key ASC');
    return rows;
  }

  static async getLeadersAdmin() {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query('SELECT * FROM tblLeaders ORDER BY display_order ASC, id ASC');
      return rows;
    }
    return mockDbStore.leaders;
  }

  static async createLeader(data: any) {
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    const [res]: any = await db.query(
      `INSERT INTO tblLeaders (name, name_ta, designation, designation_ta, district, district_ta, qualification, photo_url, phone, email, bio, display_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.name_ta || null,
        data.designation,
        data.designation_ta || null,
        data.district || null,
        data.district_ta || null,
        data.qualification || null,
        data.photo_url || null,
        data.phone || null,
        data.email || null,
        data.bio || null,
        Number(data.display_order) || 0,
        data.status || 'ACTIVE',
      ]
    );
    const [rows]: any = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [res.insertId]);
    return rows[0];
  }

  static async updateLeader(id: number, data: any) {
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    const [existing]: any = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [id]);
    if (!existing[0]) return null;
    const row = existing[0];
    await db.query(
      `UPDATE tblLeaders SET name=?, name_ta=?, designation=?, designation_ta=?, district=?, district_ta=?, qualification=?, photo_url=?, phone=?, email=?, bio=?, display_order=?, status=?
       WHERE id=?`,
      [
        data.name ?? row.name,
        data.name_ta !== undefined ? data.name_ta : row.name_ta,
        data.designation ?? row.designation,
        data.designation_ta !== undefined ? data.designation_ta : row.designation_ta,
        data.district !== undefined ? data.district : row.district,
        data.district_ta !== undefined ? data.district_ta : row.district_ta,
        data.qualification !== undefined ? data.qualification : row.qualification,
        data.photo_url !== undefined ? data.photo_url : row.photo_url,
        data.phone !== undefined ? data.phone : row.phone,
        data.email !== undefined ? data.email : row.email,
        data.bio !== undefined ? data.bio : row.bio,
        data.display_order !== undefined ? Number(data.display_order) : row.display_order,
        data.status || row.status,
        id,
      ]
    );
    const [rows]: any = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [id]);
    return rows[0];
  }

  static async deleteLeader(id: number) {
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    const [res]: any = await db.query('DELETE FROM tblLeaders WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  static async getPages() {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query('SELECT * FROM tblOrganization_pages ORDER BY id ASC');
      return rows;
    }
    return Object.entries(mockDbStore.organization_pages || {}).map(([page_key, p]: any) => ({
      page_key,
      title: p.title,
      content: p.content,
    }));
  }

  static async getPage(pageKey: string) {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT * FROM organization_pages WHERE page_key = ?', [pageKey]);
    return rows[0] || null;
  }

  static async savePage(pageKey: string, data: any) {
    if (!PAGE_KEY_PATTERN.test(pageKey)) {
      throw new HttpError(400, 'Page key may only contain lowercase letters, numbers, - and _', 'VALIDATION_ERROR', { field: 'page_key' });
    }
    requireFields(data, [['title', 'Title'], ['content', 'Content']]);
    const db = await getDbConnection();
    await db.query(
      `INSERT INTO organization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)
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
