"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const content_1 = require("../utils/content");
const STATUSES = ['DRAFT', 'PUBLISHED'];
function pickDate(value) {
    if (value == null || value === '')
        return null;
    const s = String(value).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
function pickTime(value) {
    if (value == null || value === '')
        return null;
    const m = String(value).trim().match(/^(\d{2}:\d{2})/);
    return m ? `${m[1]}:00` : null;
}
class NewsService {
    static async list(filters, includeDrafts) {
        const db = await (0, database_1.getDbConnection)();
        let query = 'SELECT * FROM tblNews WHERE 1=1';
        const params = [];
        if (!includeDrafts) {
            query += " AND status = 'PUBLISHED'";
        }
        else if (STATUSES.includes(filters.status)) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.featured === 'true')
            query += ' AND is_featured = 1';
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
        const [rows] = await db.query(query, params);
        return rows;
    }
    static async get(idOrSlug, includeDrafts) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query(`SELECT * FROM tblNews WHERE (id = ? OR slug = ?) ${includeDrafts ? '' : "AND status = 'PUBLISHED'"} LIMIT 1`, [Number(idOrSlug) || 0, idOrSlug]);
        return rows[0] || null;
    }
    static async create(data, authorId) {
        (0, content_1.requireFields)(data, [['title', 'Title'], ['summary', 'Summary'], ['content', 'Content']]);
        const db = await (0, database_1.getDbConnection)();
        const [res] = await db.query(`INSERT INTO tblNews (author_id, category, title, title_ta, slug, summary, summary_ta, content, content_ta, cover_image, place, place_ta, news_date, news_time, is_featured, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [
            authorId,
            (0, content_1.pickOptional)(data, 'category') || 'Announcement',
            String(data.title).trim(),
            (0, content_1.pickOptional)(data, 'title_ta'),
            (0, content_1.slugify)(data.title),
            String(data.summary).trim(),
            (0, content_1.pickOptional)(data, 'summary_ta'),
            String(data.content),
            (0, content_1.pickOptional)(data, 'content_ta'),
            (0, content_1.pickOptional)(data, 'cover_image'),
            (0, content_1.pickOptional)(data, 'place'),
            (0, content_1.pickOptional)(data, 'place_ta'),
            pickDate(data.news_date),
            pickTime(data.news_time),
            data.is_featured ? 1 : 0,
            (0, content_1.oneOf)(data.status, STATUSES, 'PUBLISHED'),
        ]);
        return this.get(String(res.insertId), true);
    }
    static async update(id, data) {
        const existing = await this.get(String(id), true);
        if (!existing)
            throw new types_1.HttpError(404, 'News article not found', 'NOT_FOUND');
        (0, content_1.requireFields)({ ...existing, ...data }, [['title', 'Title'], ['summary', 'Summary'], ['content', 'Content']]);
        const merged = { ...existing, ...data };
        const db = await (0, database_1.getDbConnection)();
        await db.query(`UPDATE tblNews SET category = ?, title = ?, title_ta = ?, summary = ?, summary_ta = ?, content = ?, content_ta = ?,
         cover_image = ?, place = ?, place_ta = ?, news_date = ?, news_time = ?, is_featured = ?, status = ? WHERE id = ?`, [
            (0, content_1.pickOptional)(merged, 'category') || 'Announcement',
            String(merged.title).trim(),
            (0, content_1.pickOptional)(merged, 'title_ta'),
            String(merged.summary).trim(),
            (0, content_1.pickOptional)(merged, 'summary_ta'),
            String(merged.content),
            (0, content_1.pickOptional)(merged, 'content_ta'),
            (0, content_1.pickOptional)(merged, 'cover_image'),
            (0, content_1.pickOptional)(merged, 'place'),
            (0, content_1.pickOptional)(merged, 'place_ta'),
            pickDate(merged.news_date),
            pickTime(merged.news_time),
            merged.is_featured === true || merged.is_featured === 1 || merged.is_featured === '1' ? 1 : 0,
            (0, content_1.oneOf)(merged.status, STATUSES, 'PUBLISHED'),
            id,
        ]);
        return this.get(String(id), true);
    }
    static async remove(id) {
        const db = await (0, database_1.getDbConnection)();
        const [res] = await db.query('DELETE FROM tblNews WHERE id = ?', [id]);
        if (res.affectedRows === 0)
            throw new types_1.HttpError(404, 'News article not found', 'NOT_FOUND');
    }
}
exports.NewsService = NewsService;
