"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const database_1 = require("../config/database");
class EventService {
    static async getEvents(status) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            let query = 'SELECT * FROM events WHERE 1=1';
            const params = [];
            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }
            query += ' ORDER BY event_date ASC';
            const [rows] = await db.query(query, params);
            return rows;
        }
        else {
            if (status)
                return database_1.mockDbStore.events.filter(e => e.status === status);
            return database_1.mockDbStore.events;
        }
    }
    static async getEventById(idOrSlug) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT * FROM events WHERE id = ? OR slug = ?', [idOrSlug, idOrSlug]);
            return rows[0] || null;
        }
        else {
            return database_1.mockDbStore.events.find(e => e.id === Number(idOrSlug) || e.slug === String(idOrSlug)) || null;
        }
    }
    static async createEvent(data, organizerId) {
        const db = await (0, database_1.getDbConnection)();
        const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (db) {
            const [res] = await db.query(`INSERT INTO events (organizer_id, title, slug, description, location, venue_address, event_date, start_time, end_time, cover_image, capacity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                organizerId,
                data.title,
                slug,
                data.description,
                data.location,
                data.venue_address,
                data.event_date,
                data.start_time,
                data.end_time || null,
                data.cover_image || null,
                data.capacity || 300,
                data.status || 'UPCOMING',
            ]);
            return { id: res.insertId, ...data, slug };
        }
        else {
            const newObj = {
                id: database_1.mockDbStore.events.length + 1,
                organizer_id: organizerId,
                title: data.title,
                slug,
                description: data.description,
                location: data.location,
                venue_address: data.venue_address,
                event_date: data.event_date,
                start_time: data.start_time,
                end_time: data.end_time || '17:00:00',
                cover_image: data.cover_image || 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
                status: data.status || 'UPCOMING',
                capacity: Number(data.capacity || 300),
            };
            database_1.mockDbStore.events.unshift(newObj);
            return newObj;
        }
    }
}
exports.EventService = EventService;
