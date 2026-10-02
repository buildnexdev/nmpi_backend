"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const database_1 = require("../config/database");
class NewsService {
    static async getNewsList(filters = {}) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            let query = `
        SELECT n.*, nc.name as category_name, u.email as author_email
        FROM news n
        LEFT JOIN news_categories nc ON n.category_id = nc.id
        LEFT JOIN users u ON n.author_id = u.id
        WHERE 1=1
      `;
            const params = [];
            if (filters.status) {
                query += ' AND n.status = ?';
                params.push(filters.status);
            }
            if (filters.is_featured !== undefined) {
                query += ' AND n.is_featured = ?';
                params.push(filters.is_featured ? 1 : 0);
            }
            if (filters.category_id) {
                query += ' AND n.category_id = ?';
                params.push(filters.category_id);
            }
            if (filters.search) {
                query += ' AND (n.title LIKE ? OR n.summary LIKE ?)';
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }
            query += ' ORDER BY n.published_at DESC';
            const [rows] = await db.query(query, params);
            return rows;
        }
        else {
            let list = [...database_1.mockDbStore.news];
            if (filters.status)
                list = list.filter(n => n.status === filters.status);
            if (filters.is_featured !== undefined)
                list = list.filter(n => Boolean(n.is_featured) === Boolean(filters.is_featured));
            if (filters.search) {
                const term = filters.search.toLowerCase();
                list = list.filter(n => n.title.toLowerCase().includes(term) || n.summary.toLowerCase().includes(term));
            }
            return list;
        }
    }
    static async getNewsById(idOrSlug) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT n.*, nc.name as category_name 
         FROM news n 
         LEFT JOIN news_categories nc ON n.category_id = nc.id 
         WHERE n.id = ? OR n.slug = ?`, [idOrSlug, idOrSlug]);
            return rows[0] || null;
        }
        else {
            return database_1.mockDbStore.news.find(n => n.id === Number(idOrSlug) || n.slug === String(idOrSlug)) || null;
        }
    }
    static async createNews(data, authorId) {
        const db = await (0, database_1.getDbConnection)();
        const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (db) {
            const [res] = await db.query(`INSERT INTO news (category_id, author_id, title, slug, summary, content, cover_image, is_featured, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [
                data.category_id || 1,
                authorId,
                data.title,
                slug,
                data.summary,
                data.content,
                data.cover_image || null,
                data.is_featured ? 1 : 0,
                data.status || 'PUBLISHED'
            ]);
            return { id: res.insertId, ...data, slug };
        }
        else {
            const newObj = {
                id: database_1.mockDbStore.news.length + 1,
                category_id: Number(data.category_id || 1),
                author_id: authorId,
                title: data.title,
                slug,
                summary: data.summary,
                content: data.content,
                cover_image: data.cover_image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
                is_featured: data.is_featured ? 1 : 0,
                status: data.status || 'PUBLISHED',
                published_at: new Date().toISOString(),
                category_name: 'Announcements',
                author_name: 'Admin',
            };
            database_1.mockDbStore.news.unshift(newObj);
            return newObj;
        }
    }
}
exports.NewsService = NewsService;
