"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsService = void 0;
const database_1 = require("../config/database");
class CmsService {
    static async getLeaders() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query("SELECT * FROM tblLeaders WHERE status = 'ACTIVE' ORDER BY display_order ASC");
            return rows;
        }
        else {
            return database_1.mockDbStore.leaders.filter(l => l.status === 'ACTIVE');
        }
    }
    static async getLeadersAdmin() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT * FROM tblLeaders ORDER BY display_order ASC, id ASC');
            return rows;
        }
        return database_1.mockDbStore.leaders;
    }
    static async createLeader(data) {
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            throw new Error('Database connection unavailable.');
        const [res] = await db.query(`INSERT INTO tblLeaders (name, name_ta, designation, designation_ta, district, district_ta, qualification, photo_url, phone, email, bio, display_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            data.name,
            data.name_ta || null,
            data.designation,
            data.designation_ta || null,
            data.district || null,
            data.district_ta || null,
            data.qualification || null,
            data.photo_url || null,
            data.phone || null,
            data.email || null,
            data.bio || null,
            Number(data.display_order) || 0,
            data.status || 'ACTIVE',
        ]);
        const [rows] = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [res.insertId]);
        return rows[0];
    }
    static async updateLeader(id, data) {
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            throw new Error('Database connection unavailable.');
        const [existing] = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [id]);
        if (!existing[0])
            return null;
        const row = existing[0];
        await db.query(`UPDATE tblLeaders SET name=?, name_ta=?, designation=?, designation_ta=?, district=?, district_ta=?, qualification=?, photo_url=?, phone=?, email=?, bio=?, display_order=?, status=?
       WHERE id=?`, [
            data.name ?? row.name,
            data.name_ta !== undefined ? data.name_ta : row.name_ta,
            data.designation ?? row.designation,
            data.designation_ta !== undefined ? data.designation_ta : row.designation_ta,
            data.district !== undefined ? data.district : row.district,
            data.district_ta !== undefined ? data.district_ta : row.district_ta,
            data.qualification !== undefined ? data.qualification : row.qualification,
            data.photo_url !== undefined ? data.photo_url : row.photo_url,
            data.phone !== undefined ? data.phone : row.phone,
            data.email !== undefined ? data.email : row.email,
            data.bio !== undefined ? data.bio : row.bio,
            data.display_order !== undefined ? Number(data.display_order) : row.display_order,
            data.status || row.status,
            id,
        ]);
        const [rows] = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [id]);
        return rows[0];
    }
    static async deleteLeader(id) {
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            throw new Error('Database connection unavailable.');
        const [res] = await db.query('DELETE FROM tblLeaders WHERE id = ?', [id]);
        return res.affectedRows > 0;
    }
    static async getPages() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT * FROM tblOrganization_pages ORDER BY id ASC');
            return rows;
        }
        return Object.entries(database_1.mockDbStore.organization_pages || {}).map(([page_key, p]) => ({
            page_key,
            title: p.title,
            content: p.content,
        }));
    }
    static async getPage(pageKey) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT * FROM tblOrganization_pages WHERE page_key = ?', [pageKey]);
            return rows[0] || null;
        }
        else {
            const p = database_1.mockDbStore.organization_pages[pageKey];
            if (!p)
                return null;
            return { page_key: pageKey, title: p.title, content: p.content };
        }
    }
    static async upsertPage(pageKey, data) {
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            throw new Error('Database connection unavailable.');
        const key = String(pageKey || data.page_key || '').trim().toLowerCase();
        if (!/^[a-z0-9-]+$/.test(key))
            throw Object.assign(new Error('Page key must be lowercase letters, numbers or dashes.'), { status: 400 });
        const existing = await this.getPage(key);
        if (existing) {
            await db.query('UPDATE tblOrganization_pages SET title=?, title_ta=?, content=?, content_ta=? WHERE page_key=?', [
                data.title ?? existing.title,
                data.title_ta !== undefined ? data.title_ta : existing.title_ta,
                data.content ?? existing.content,
                data.content_ta !== undefined ? data.content_ta : existing.content_ta,
                key,
            ]);
        }
        else {
            await db.query('INSERT INTO tblOrganization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)', [key, data.title || key, data.title_ta || null, data.content || '', data.content_ta || null]);
        }
        return this.getPage(key);
    }
    // There is no gallery table in the current schema; serve the built-in album list.
    static async getGalleryAlbums() {
        return database_1.mockDbStore.gallery_albums;
    }
    static async getGeography() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [districts] = await db.query("SELECT * FROM tblDistricts WHERE status = 'ACTIVE' ORDER BY name_en ASC");
            const [blocks] = await db.query("SELECT * FROM tblBlocks WHERE status = 'ACTIVE' ORDER BY name_en ASC");
            const [parliaments] = await db.query("SELECT * FROM tblParliament_constituencies WHERE status = 'ACTIVE' ORDER BY name_en ASC");
            const [roles] = await db.query('SELECT id, name, description FROM tblRoles ORDER BY id ASC');
            return { districts, blocks, parliaments, roles };
        }
        else {
            return {
                districts: database_1.mockDbStore.districts,
                blocks: database_1.mockDbStore.taluks,
                parliaments: [],
                roles: [],
            };
        }
    }
}
exports.CmsService = CmsService;
