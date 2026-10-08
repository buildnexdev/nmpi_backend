"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const content_1 = require("../utils/content");
const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
const REQUIRED = [
    ['title', 'Title'],
    ['description', 'Description'],
    ['location', 'Location'],
    ['event_date', 'Event date'],
    ['start_time', 'Start time'],
];
function validate(data) {
    (0, content_1.requireFields)(data, REQUIRED);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.event_date))) {
        throw new types_1.HttpError(400, 'Event date must be in YYYY-MM-DD format', 'VALIDATION_ERROR', { field: 'event_date' });
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(String(data.start_time))) {
        throw new types_1.HttpError(400, 'Start time must be in HH:MM format', 'VALIDATION_ERROR', { field: 'start_time' });
    }
}
class EventService {
    static async list(filters, includeAll) {
        const db = await (0, database_1.getDbConnection)();
        let query = 'SELECT * FROM tblEvents WHERE 1=1';
        const params = [];
        if (STATUSES.includes(filters.status)) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        else if (!includeAll) {
            query += " AND status <> 'CANCELLED'";
        }
        if (filters.upcoming === 'true')
            query += ' AND event_date >= CURDATE()';
        query += filters.upcoming === 'true' ? ' ORDER BY event_date ASC, start_time ASC' : ' ORDER BY event_date DESC, start_time ASC';
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(Math.min(Number(filters.limit) || 10, 100));
        }
        const [rows] = await db.query(query, params);
        return rows;
    }
    static async get(idOrSlug) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT * FROM tblEvents WHERE id = ? OR slug = ? LIMIT 1', [Number(idOrSlug) || 0, idOrSlug]);
        return rows[0] || null;
    }
    static async create(data, organizerId) {
        validate(data);
        const db = await (0, database_1.getDbConnection)();
        const [res] = await db.query(`INSERT INTO tblEvents (organizer_id, title, title_ta, slug, description, description_ta, location, venue_address,
         event_date, start_time, end_time, cover_image, capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            organizerId,
            String(data.title).trim(),
            (0, content_1.pickOptional)(data, 'title_ta'),
            (0, content_1.slugify)(data.title),
            String(data.description),
            (0, content_1.pickOptional)(data, 'description_ta'),
            String(data.location).trim(),
            (0, content_1.pickOptional)(data, 'venue_address'),
            data.event_date,
            data.start_time,
            (0, content_1.pickOptional)(data, 'end_time'),
            (0, content_1.pickOptional)(data, 'cover_image'),
            Number(data.capacity) || 500,
            (0, content_1.oneOf)(data.status, STATUSES, 'UPCOMING'),
        ]);
        return this.get(String(res.insertId));
    }
    static async update(id, data) {
        const existing = await this.get(String(id));
        if (!existing)
            throw new types_1.HttpError(404, 'Event not found', 'NOT_FOUND');
        const merged = { ...existing, ...data };
        validate(merged);
        const db = await (0, database_1.getDbConnection)();
        await db.query(`UPDATE tblEvents SET title = ?, title_ta = ?, description = ?, description_ta = ?, location = ?, venue_address = ?,
         event_date = ?, start_time = ?, end_time = ?, cover_image = ?, capacity = ?, status = ? WHERE id = ?`, [
            String(merged.title).trim(),
            (0, content_1.pickOptional)(merged, 'title_ta'),
            String(merged.description),
            (0, content_1.pickOptional)(merged, 'description_ta'),
            String(merged.location).trim(),
            (0, content_1.pickOptional)(merged, 'venue_address'),
            merged.event_date,
            merged.start_time,
            (0, content_1.pickOptional)(merged, 'end_time'),
            (0, content_1.pickOptional)(merged, 'cover_image'),
            Number(merged.capacity) || 500,
            (0, content_1.oneOf)(merged.status, STATUSES, 'UPCOMING'),
            id,
        ]);
        return this.get(String(id));
    }
    static async remove(id) {
        const db = await (0, database_1.getDbConnection)();
        const [res] = await db.query('DELETE FROM tblEvents WHERE id = ?', [id]);
        if (res.affectedRows === 0)
            throw new types_1.HttpError(404, 'Event not found', 'NOT_FOUND');
    }
}
exports.EventService = EventService;
