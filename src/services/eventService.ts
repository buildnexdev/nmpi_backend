import { getDbConnection } from '../config/database';
import { HttpError } from '../types';
import { slugify, requireFields, pickOptional, oneOf } from '../utils/content';

const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;
const REQUIRED: Array<[string, string]> = [
  ['title', 'Title'],
  ['description', 'Description'],
  ['location', 'Location'],
  ['event_date', 'Event date'],
  ['start_time', 'Start time'],
];

function validate(data: any) {
  requireFields(data, REQUIRED);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.event_date))) {
    throw new HttpError(400, 'Event date must be in YYYY-MM-DD format', 'VALIDATION_ERROR', { field: 'event_date' });
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(String(data.start_time))) {
    throw new HttpError(400, 'Start time must be in HH:MM format', 'VALIDATION_ERROR', { field: 'start_time' });
  }
}

export class EventService {
  static async list(filters: any, includeAll: boolean) {
    const db = await getDbConnection();
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];

    if (STATUSES.includes(filters.status)) {
      query += ' AND status = ?';
      params.push(filters.status);
    } else if (!includeAll) {
      query += " AND status <> 'CANCELLED'";
    }
    if (filters.upcoming === 'true') query += ' AND event_date >= CURDATE()';
    query += filters.upcoming === 'true' ? ' ORDER BY event_date ASC, start_time ASC' : ' ORDER BY event_date DESC, start_time ASC';
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(Math.min(Number(filters.limit) || 10, 100));
    }

    const [rows]: any = await db.query(query, params);
    return rows;
  }

  static async get(idOrSlug: string) {
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT * FROM events WHERE id = ? OR slug = ? LIMIT 1', [Number(idOrSlug) || 0, idOrSlug]);
    return rows[0] || null;
  }

  static async create(data: any, organizerId: number) {
    validate(data);
    const db = await getDbConnection();
    const [res]: any = await db.query(
      `INSERT INTO events (organizer_id, title, title_ta, slug, description, description_ta, location, venue_address,
         event_date, start_time, end_time, cover_image, capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizerId,
        String(data.title).trim(),
        pickOptional(data, 'title_ta'),
        slugify(data.title),
        String(data.description),
        pickOptional(data, 'description_ta'),
        String(data.location).trim(),
        pickOptional(data, 'venue_address'),
        data.event_date,
        data.start_time,
        pickOptional(data, 'end_time'),
        pickOptional(data, 'cover_image'),
        Number(data.capacity) || 500,
        oneOf(data.status, STATUSES, 'UPCOMING'),
      ]
    );
    return this.get(String(res.insertId));
  }

  static async update(id: number, data: any) {
    const existing = await this.get(String(id));
    if (!existing) throw new HttpError(404, 'Event not found', 'NOT_FOUND');
    const merged = { ...existing, ...data };
    validate(merged);

    const db = await getDbConnection();
    await db.query(
      `UPDATE events SET title = ?, title_ta = ?, description = ?, description_ta = ?, location = ?, venue_address = ?,
         event_date = ?, start_time = ?, end_time = ?, cover_image = ?, capacity = ?, status = ? WHERE id = ?`,
      [
        String(merged.title).trim(),
        pickOptional(merged, 'title_ta'),
        String(merged.description),
        pickOptional(merged, 'description_ta'),
        String(merged.location).trim(),
        pickOptional(merged, 'venue_address'),
        merged.event_date,
        merged.start_time,
        pickOptional(merged, 'end_time'),
        pickOptional(merged, 'cover_image'),
        Number(merged.capacity) || 500,
        oneOf(merged.status, STATUSES, 'UPCOMING'),
        id,
      ]
    );
    return this.get(String(id));
  }

  static async remove(id: number) {
    const db = await getDbConnection();
    const [res]: any = await db.query('DELETE FROM events WHERE id = ?', [id]);
    if (res.affectedRows === 0) throw new HttpError(404, 'Event not found', 'NOT_FOUND');
  }
}
