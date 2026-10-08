import { getDbConnection } from '../config/database';
import { HttpError } from '../types';
import { slugify, requireFields, pickOptional, oneOf } from '../utils/content';

const STATUSES = ['DRAFT', 'PUBLISHED'] as const;

function pickDate(value: unknown): string | null {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function pickTime(value: unknown): string | null {
  if (value == null || value === '') return null;
  const m = String(value).trim().match(/^(\d{2}:\d{2})/);
  return m ? `${m[1]}:00` : null;
}

export class NewsService {
  static async list(filters: any, includeDrafts: boolean) {
    const db = await getDbConnection();
    let query = 'SELECT * FROM tblNews WHERE 1=1';
    const params: any[] = [];

    if (!includeDrafts) {
      query += " AND status = 'PUBLISHED'";
    } else if (STATUSES.includes(filters.status)) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.featured === 'true') query += ' AND is_featured = 1';
    if (filters.search) {
      query += ' AND (title LIKE ? OR title_ta LIKE ? OR summary LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }
    query += ' ORDER BY published_at DESC, id DESC';
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(Math.min(Number(filters.limit) || 10, 100));
    }

    const [rows]: any = await db.query(query, params);
    return rows;
  }

  static async get(idOrSlug: string, includeDrafts: boolean) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(
      `SELECT * FROM tblNews WHERE (id = ? OR slug = ?) ${includeDrafts ? '' : "AND status = 'PUBLISHED'"} LIMIT 1`,
      [Number(idOrSlug) || 0, idOrSlug]
    );
    return rows[0] || null;
  }

  static async create(data: any, authorId: number) {
    requireFields(data, [['title', 'Title'], ['summary', 'Summary'], ['content', 'Content']]);
    const db = await getDbConnection();
    const [res]: any = await db.query(
      `INSERT INTO tblNews (author_id, category, title, title_ta, slug, summary, summary_ta, content, content_ta, cover_image, place, place_ta, news_date, news_time, is_featured, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        authorId,
        pickOptional(data, 'category') || 'Announcement',
        String(data.title).trim(),
        pickOptional(data, 'title_ta'),
        slugify(data.title),
        String(data.summary).trim(),
        pickOptional(data, 'summary_ta'),
        String(data.content),
        pickOptional(data, 'content_ta'),
        pickOptional(data, 'cover_image'),
        pickOptional(data, 'place'),
        pickOptional(data, 'place_ta'),
        pickDate(data.news_date),
        pickTime(data.news_time),
        data.is_featured ? 1 : 0,
        oneOf(data.status, STATUSES, 'PUBLISHED'),
      ]
    );
    return this.get(String(res.insertId), true);
  }

  static async update(id: number, data: any) {
    const existing = await this.get(String(id), true);
    if (!existing) throw new HttpError(404, 'News article not found', 'NOT_FOUND');
    requireFields({ ...existing, ...data }, [['title', 'Title'], ['summary', 'Summary'], ['content', 'Content']]);

    const merged = { ...existing, ...data };
    const db = await getDbConnection();
    await db.query(
      `UPDATE tblNews SET category = ?, title = ?, title_ta = ?, summary = ?, summary_ta = ?, content = ?, content_ta = ?,
         cover_image = ?, place = ?, place_ta = ?, news_date = ?, news_time = ?, is_featured = ?, status = ? WHERE id = ?`,
      [
        pickOptional(merged, 'category') || 'Announcement',
        String(merged.title).trim(),
        pickOptional(merged, 'title_ta'),
        String(merged.summary).trim(),
        pickOptional(merged, 'summary_ta'),
        String(merged.content),
        pickOptional(merged, 'content_ta'),
        pickOptional(merged, 'cover_image'),
        pickOptional(merged, 'place'),
        pickOptional(merged, 'place_ta'),
        pickDate(merged.news_date),
        pickTime(merged.news_time),
        merged.is_featured === true || merged.is_featured === 1 || merged.is_featured === '1' ? 1 : 0,
        oneOf(merged.status, STATUSES, 'PUBLISHED'),
        id,
      ]
    );
    return this.get(String(id), true);
  }

  static async remove(id: number) {
    const db = await getDbConnection();
    const [res]: any = await db.query('DELETE FROM tblNews WHERE id = ?', [id]);
    if (res.affectedRows === 0) throw new HttpError(404, 'News article not found', 'NOT_FOUND');
  }
}
