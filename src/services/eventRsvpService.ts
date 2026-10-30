import { getDbConnection } from '../config/database';
import { HttpError } from '../types';

const RSVP_STATUSES = ['GOING', 'INTERESTED', 'NOT_GOING'] as const;

export class EventRsvpService {
  static async upsert(eventId: number, userId: number, memberDbId: number | null, status: string) {
    if (!RSVP_STATUSES.includes(status as any)) {
      throw new HttpError(400, 'Invalid RSVP status', 'VALIDATION_ERROR', { field: 'status' });
    }

    const db = await getDbConnection();
    const [events]: any = await db.query(
      `SELECT id, status FROM tblEvents WHERE id = ? LIMIT 1`,
      [eventId]
    );
    if (!events[0]) throw new HttpError(404, 'Event not found', 'NOT_FOUND');
    if (events[0].status === 'CANCELLED') {
      throw new HttpError(400, 'Cannot RSVP to a cancelled event', 'VALIDATION_ERROR');
    }

    await db.query(
      `INSERT INTO tblEvent_rsvps (event_id, user_id, member_id, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), member_id = VALUES(member_id), updated_at = CURRENT_TIMESTAMP`,
      [eventId, userId, memberDbId, status]
    );

    return this.getMyRsvp(eventId, userId);
  }

  static async getMyRsvp(eventId: number, userId: number) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(
      `SELECT id, event_id, status, checked_in, checked_in_at, created_at
       FROM tblEvent_rsvps WHERE event_id = ? AND user_id = ? LIMIT 1`,
      [eventId, userId]
    );
    return rows[0] || null;
  }

  static async listForEvent(eventId: number) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(
      `SELECT r.id, r.user_id, r.member_id, r.status, r.checked_in, r.checked_in_at, r.created_at,
              COALESCE(m.full_name, u.email) AS name,
              m.member_id AS member_code
       FROM tblEvent_rsvps r
       LEFT JOIN tblUsers u ON u.id = r.user_id
       LEFT JOIN tblMembers m ON m.id = r.member_id
       WHERE r.event_id = ?
       ORDER BY r.created_at DESC`,
      [eventId]
    );
    return rows;
  }

  static async counts(eventId: number) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(
      `SELECT
         SUM(status = 'GOING') AS going,
         SUM(status = 'INTERESTED') AS interested,
         SUM(checked_in = 1) AS checked_in
       FROM tblEvent_rsvps WHERE event_id = ?`,
      [eventId]
    );
    return {
      going: Number(rows[0]?.going) || 0,
      interested: Number(rows[0]?.interested) || 0,
      checked_in: Number(rows[0]?.checked_in) || 0,
    };
  }

  static async checkIn(eventId: number, userId: number) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(
      `SELECT id, status, checked_in FROM tblEvent_rsvps WHERE event_id = ? AND user_id = ? LIMIT 1`,
      [eventId, userId]
    );
    if (!rows[0]) {
      throw new HttpError(400, 'RSVP as Going first, then check in', 'VALIDATION_ERROR');
    }
    if (rows[0].status !== 'GOING') {
      throw new HttpError(400, 'Only members marked Going can check in', 'VALIDATION_ERROR');
    }
    if (rows[0].checked_in) {
      return this.getMyRsvp(eventId, userId);
    }

    await db.query(
      `UPDATE tblEvent_rsvps SET checked_in = 1, checked_in_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [rows[0].id]
    );
    return this.getMyRsvp(eventId, userId);
  }
}
