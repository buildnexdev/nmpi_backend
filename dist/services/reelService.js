"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReelService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
class ReelService {
    static async list(filters, viewerUserId) {
        const db = await (0, database_1.getDbConnection)();
        const limit = Math.min(Number(filters.limit) || 30, 100);
        const params = [viewerUserId || 0, limit];
        const [rows] = await db.query(`SELECT r.id, r.user_id, r.title, r.caption, r.video_url, r.thumbnail_url, r.district_id,
              r.view_count, r.created_at,
              COALESCE(m.full_name, u.email, 'NMPI') AS author_name,
              (SELECT COUNT(*) FROM tblReel_likes rl WHERE rl.reel_id = r.id) AS like_count,
              EXISTS(SELECT 1 FROM tblReel_likes rl2 WHERE rl2.reel_id = r.id AND rl2.user_id = ?) AS liked_by_me
       FROM tblReels r
       LEFT JOIN tblUsers u ON u.id = r.user_id
       LEFT JOIN tblMembers m ON m.user_id = r.user_id
       WHERE r.status = 'ACTIVE'
       ORDER BY r.created_at DESC
       LIMIT ?`, params);
        return rows.map((r) => ({
            ...r,
            liked_by_me: Boolean(r.liked_by_me),
            like_count: Number(r.like_count) || 0,
            view_count: Number(r.view_count) || 0,
        }));
    }
    static async create(userId, data) {
        const title = String(data.title || '').trim();
        const videoUrl = String(data.video_url || '').trim();
        if (!title)
            throw new types_1.HttpError(400, 'Title is required', 'VALIDATION_ERROR', { field: 'title' });
        if (!videoUrl)
            throw new types_1.HttpError(400, 'Video URL is required', 'VALIDATION_ERROR', { field: 'video_url' });
        const db = await (0, database_1.getDbConnection)();
        const [result] = await db.query(`INSERT INTO tblReels (user_id, title, caption, video_url, thumbnail_url, district_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`, [
            userId,
            title,
            data.caption ? String(data.caption).trim() : null,
            videoUrl,
            data.thumbnail_url || null,
            data.district_id ? Number(data.district_id) : null,
        ]);
        return { id: result.insertId, title, video_url: videoUrl };
    }
    static async recordView(reelId) {
        const db = await (0, database_1.getDbConnection)();
        await db.query(`UPDATE tblReels SET view_count = view_count + 1 WHERE id = ? AND status = 'ACTIVE'`, [reelId]);
    }
    static async toggleLike(reelId, userId) {
        const db = await (0, database_1.getDbConnection)();
        const [reels] = await db.query(`SELECT id FROM tblReels WHERE id = ? AND status = 'ACTIVE' LIMIT 1`, [reelId]);
        if (!reels[0])
            throw new types_1.HttpError(404, 'Reel not found', 'NOT_FOUND');
        const [existing] = await db.query('SELECT id FROM tblReel_likes WHERE reel_id = ? AND user_id = ? LIMIT 1', [reelId, userId]);
        if (existing[0]) {
            await db.query('DELETE FROM tblReel_likes WHERE id = ?', [existing[0].id]);
        }
        else {
            await db.query('INSERT INTO tblReel_likes (reel_id, user_id) VALUES (?, ?)', [reelId, userId]);
        }
        const [countRows] = await db.query('SELECT COUNT(*) AS c FROM tblReel_likes WHERE reel_id = ?', [reelId]);
        return {
            reel_id: reelId,
            liked: !existing[0],
            like_count: Number(countRows[0]?.c) || 0,
        };
    }
    static async remove(reelId) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT id FROM tblReels WHERE id = ? LIMIT 1', [reelId]);
        if (!rows[0])
            throw new types_1.HttpError(404, 'Reel not found', 'NOT_FOUND');
        await db.query(`UPDATE tblReels SET status = 'DELETED' WHERE id = ?`, [reelId]);
    }
}
exports.ReelService = ReelService;
