import { getDbConnection, mockDbStore } from '../config/database';

export class EventService {
  static async getEvents(filters: any = {}) {
    const db = await getDbConnection();
    const status = typeof filters === 'string' ? filters : filters?.status;
    const upcoming = typeof filters === 'object' && filters?.upcoming;
    const limit = typeof filters === 'object' ? Number(filters?.limit) : 0;
    if (db) {
      let query = 'SELECT * FROM tblEvents WHERE 1=1';
      const params: any[] = [];
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      } else if (upcoming) {
        query += " AND status = 'UPCOMING' AND event_date >= CURDATE()";
      }
      query += ' ORDER BY event_date ASC';
      if (Number.isInteger(limit) && limit > 0) {
        query += ' LIMIT ?';
        params.push(limit);
      }
      const [rows]: any = await db.query(query, params);
      return rows;
    } else {
      let list = [...mockDbStore.events];
      if (status) list = list.filter(e => e.status === status);
      else if (upcoming) list = list.filter(e => e.status === 'UPCOMING');
      if (Number.isInteger(limit) && limit > 0) list = list.slice(0, limit);
      return list;
    }
  }

  static async getEventById(idOrSlug: string | number) {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query('SELECT * FROM tblEvents WHERE id = ? OR slug = ?', [idOrSlug, idOrSlug]);
      return rows[0] || null;
    } else {
      return mockDbStore.events.find(e => e.id === Number(idOrSlug) || e.slug === String(idOrSlug)) || null;
    }
  }

  static async createEvent(data: any, organizerId: number) {
    const db = await getDbConnection();
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (db) {
      const [res]: any = await db.query(
        `INSERT INTO tblEvents (organizer_id, title, title_ta, slug, description, description_ta, location, venue_address, event_date, start_time, end_time, cover_image, capacity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          organizerId,
          data.title,
          data.title_ta || null,
          slug,
          data.description,
          data.description_ta || null,
          data.location,
          data.venue_address,
          data.event_date,
          data.start_time,
          data.end_time || null,
          data.cover_image || null,
          data.capacity || 300,
          data.status || 'UPCOMING',
        ]
      );
      return { id: res.insertId, ...data, slug };
    } else {
      const newObj = {
        id: mockDbStore.events.length + 1,
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
      mockDbStore.events.unshift(newObj as any);
      return newObj;
    }
  }

  static async updateEvent(id: number, data: any) {
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    const existing = await this.getEventById(id);
    if (!existing) return null;
    await db.query(
      `UPDATE tblEvents SET title=?, title_ta=?, description=?, description_ta=?, location=?, venue_address=?, event_date=?, start_time=?, end_time=?, cover_image=?, capacity=?, status=?
       WHERE id=?`,
      [
        data.title ?? existing.title,
        data.title_ta ?? existing.title_ta ?? null,
        data.description ?? existing.description,
        data.description_ta ?? existing.description_ta ?? null,
        data.location ?? existing.location,
        data.venue_address !== undefined ? data.venue_address : existing.venue_address,
        data.event_date ?? existing.event_date,
        data.start_time ?? existing.start_time,
        data.end_time !== undefined ? data.end_time : existing.end_time,
        data.cover_image !== undefined ? data.cover_image : existing.cover_image,
        data.capacity ?? existing.capacity,
        data.status ?? existing.status,
        id,
      ]
    );
    return this.getEventById(id);
  }

  static async deleteEvent(id: number) {
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    const [res]: any = await db.query('DELETE FROM tblEvents WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }
}
