import { getDbConnection, mockDbStore } from '../config/database';

export class NewsService {
  static async getNewsList(filters: any = {}) {
    const db = await getDbConnection();
    if (db) {
      let query = `
        SELECT n.*, n.category as category_name, u.email as author_email
        FROM tblNews n
        LEFT JOIN tblUsers u ON n.author_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (filters.status) {
        query += ' AND n.status = ?';
        params.push(filters.status);
      }
      if (filters.is_featured !== undefined) {
        query += ' AND n.is_featured = ?';
        params.push(filters.is_featured ? 1 : 0);
      }
      if (filters.category) {
        query += ' AND n.category = ?';
        params.push(filters.category);
      }
      if (filters.search) {
        query += ' AND (n.title LIKE ? OR n.summary LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      query += ' ORDER BY n.published_at DESC';
      const limit = Number(filters.limit);
      if (Number.isInteger(limit) && limit > 0) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const [rows]: any = await db.query(query, params);
      return rows;
    } else {
      let list = [...mockDbStore.news];
      if (filters.status) list = list.filter(n => n.status === filters.status);
      if (filters.is_featured !== undefined) list = list.filter(n => Boolean(n.is_featured) === Boolean(filters.is_featured));
      if (filters.search) {
        const term = filters.search.toLowerCase();
        list = list.filter(n => n.title.toLowerCase().includes(term) || n.summary.toLowerCase().includes(term));
      }
      const limit = Number(filters.limit);
      if (Number.isInteger(limit) && limit > 0) list = list.slice(0, limit);
      return list;
    }
  }

  static async getNewsById(idOrSlug: string | number) {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query(
        `SELECT n.*, n.category as category_name
         FROM tblNews n
         WHERE n.id = ? OR n.slug = ?`,
        [idOrSlug, idOrSlug]
      );
      return rows[0] || null;
    } else {
      return mockDbStore.news.find(n => n.id === Number(idOrSlug) || n.slug === String(idOrSlug)) || null;
    }
  }

  static async createNews(data: any, authorId: number) {
    const db = await getDbConnection();
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (db) {
      const [res]: any = await db.query(
        `INSERT INTO tblNews (category, author_id, title, title_ta, slug, summary, summary_ta, content, content_ta, cover_image, is_featured, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          data.category || 'Announcement',
          authorId,
          data.title,
          data.title_ta || null,
          slug,
          data.summary,
          data.summary_ta || null,
          data.content,
          data.content_ta || null,
          data.cover_image || null,
          data.is_featured ? 1 : 0,
          data.status || 'PUBLISHED'
        ]
      );
      return { id: res.insertId, ...data, slug };
    } else {
      const newObj = {
        id: mockDbStore.news.length + 1,
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
      mockDbStore.news.unshift(newObj);
      return newObj;
    }
  }

  static async updateNews(id: number, data: any) {
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    const existing = await this.getNewsById(id);
    if (!existing) return null;
    const slug = data.slug || existing.slug;
    await db.query(
      `UPDATE tblNews SET category=?, title=?, title_ta=?, slug=?, summary=?, summary_ta=?, content=?, content_ta=?, cover_image=?, is_featured=?, status=?
       WHERE id=?`,
      [
        data.category || existing.category || 'Announcement',
        data.title ?? existing.title,
        data.title_ta ?? existing.title_ta ?? null,
        slug,
        data.summary ?? existing.summary,
        data.summary_ta ?? existing.summary_ta ?? null,
        data.content ?? existing.content,
        data.content_ta ?? existing.content_ta ?? null,
        data.cover_image !== undefined ? data.cover_image : existing.cover_image,
        data.is_featured ? 1 : 0,
        data.status || existing.status,
        id,
      ]
    );
    return this.getNewsById(id);
  }

  static async deleteNews(id: number) {
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    const [res]: any = await db.query('DELETE FROM tblNews WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }
}
