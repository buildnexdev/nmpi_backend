import { getDbConnection } from '../config/database';
import { HttpError } from '../types';

export class FeedService {
  static async list(filters: any, viewerUserId?: number | null) {
    const db = await getDbConnection();
    const limit = Math.min(Number(filters.limit) || 30, 100);
    const params: any[] = [];
    let where = "p.status = 'ACTIVE'";

    if (filters.district_id) {
      where += ' AND (p.district_id = ? OR p.district_id IS NULL)';
      params.push(Number(filters.district_id));
    }

    params.push(viewerUserId || 0);
    params.push(limit);

    const [rows]: any = await db.query(
      `SELECT p.id, p.user_id, p.member_id, p.body, p.image_url, p.district_id, p.created_at,
              COALESCE(m.full_name, u.email, 'Member') AS author_name,
              m.profile_image AS author_photo,
              m.member_id AS author_member_id,
              (SELECT COUNT(*) FROM tblFeed_likes fl WHERE fl.post_id = p.id) AS like_count,
              EXISTS(SELECT 1 FROM tblFeed_likes fl2 WHERE fl2.post_id = p.id AND fl2.user_id = ?) AS liked_by_me
       FROM tblFeed_posts p
       LEFT JOIN tblUsers u ON u.id = p.user_id
       LEFT JOIN tblMembers m ON m.id = p.member_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ?`,
      params
    );

    return rows.map((r: any) => ({
      ...r,
      liked_by_me: Boolean(r.liked_by_me),
      like_count: Number(r.like_count) || 0,
    }));
  }

  static async create(userId: number, memberDbId: number | null, data: any) {
    const body = String(data.body || '').trim();
    if (!body) throw new HttpError(400, 'Post text is required', 'VALIDATION_ERROR', { field: 'body' });
    if (body.length > 2000) throw new HttpError(400, 'Post is too long (max 2000 characters)', 'VALIDATION_ERROR');

    const db = await getDbConnection();
    let districtId = data.district_id ? Number(data.district_id) : null;
    if (!districtId && memberDbId) {
      const [mrows]: any = await db.query('SELECT district_id FROM tblMembers WHERE id = ? LIMIT 1', [memberDbId]);
      districtId = mrows[0]?.district_id || null;
    }

    const [result]: any = await db.query(
      `INSERT INTO tblFeed_posts (user_id, member_id, body, image_url, district_id, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [userId, memberDbId, body, data.image_url || null, districtId]
    );

    const list = await this.list({ limit: 1 }, userId);
    const created = list.find((p: any) => p.id === result.insertId);
    return created || { id: result.insertId, body, like_count: 0, liked_by_me: false };
  }

  static async toggleLike(postId: number, userId: number) {
    const db = await getDbConnection();
    const [posts]: any = await db.query(
      `SELECT id FROM tblFeed_posts WHERE id = ? AND status = 'ACTIVE' LIMIT 1`,
      [postId]
    );
    if (!posts[0]) throw new HttpError(404, 'Post not found', 'NOT_FOUND');

    const [existing]: any = await db.query(
      'SELECT id FROM tblFeed_likes WHERE post_id = ? AND user_id = ? LIMIT 1',
      [postId, userId]
    );

    if (existing[0]) {
      await db.query('DELETE FROM tblFeed_likes WHERE id = ?', [existing[0].id]);
    } else {
      await db.query('INSERT INTO tblFeed_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    }

    const [countRows]: any = await db.query(
      'SELECT COUNT(*) AS c FROM tblFeed_likes WHERE post_id = ?',
      [postId]
    );

    return {
      post_id: postId,
      liked: !existing[0],
      like_count: Number(countRows[0]?.c) || 0,
    };
  }

  static async remove(postId: number, userId: number, isAdmin: boolean) {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT id, user_id FROM tblFeed_posts WHERE id = ? LIMIT 1', [postId]);
    if (!rows[0]) throw new HttpError(404, 'Post not found', 'NOT_FOUND');
    if (!isAdmin && rows[0].user_id !== userId) {
      throw new HttpError(403, 'You can only delete your own posts', 'FORBIDDEN');
    }
    await db.query(`UPDATE tblFeed_posts SET status = 'DELETED' WHERE id = ?`, [postId]);
  }
}
