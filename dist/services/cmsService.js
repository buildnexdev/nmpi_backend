"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const content_1 = require("../utils/content");
const LEADER_FIELDS = ['name_ta', 'designation_ta', 'district', 'district_ta', 'qualification', 'photo_url', 'phone', 'email', 'bio'];
const PAGE_KEY_PATTERN = /^[a-z0-9_-]{2,50}$/;
class CmsService {
    static async getPublicStats() {
        const db = await (0, database_1.getDbConnection)();
        const [[members]] = await db.query("SELECT COUNT(*) AS c, COUNT(DISTINCT district_id) AS d FROM tblMembers WHERE status = 'APPROVED'");
        const [[leaders]] = await db.query("SELECT COUNT(*) AS c FROM tblLeaders WHERE status = 'ACTIVE'");
        const [[districts]] = await db.query('SELECT COUNT(*) AS c FROM tblDistricts');
        const [[events]] = await db.query("SELECT COUNT(*) AS c FROM tblEvents WHERE status IN ('UPCOMING','ONGOING') AND event_date >= CURDATE()");
        return {
            members: Number(members.c) || 0,
            member_districts: Number(members.d) || 0,
            leaders: Number(leaders.c) || 0,
            districts: Number(districts.c) || 0,
            upcoming_events: Number(events.c) || 0,
        };
    }
    static async listLeaders(includeInactive) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query(`SELECT * FROM tblLeaders ${includeInactive ? '' : "WHERE status = 'ACTIVE'"} ORDER BY display_order ASC, id ASC`);
        return rows;
    }
    static async getLeader(id) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT * FROM tblLeaders WHERE id = ?', [id]);
        return rows[0] || null;
    }
    static async saveLeader(data, id) {
        const existing = id ? await this.getLeader(id) : null;
        if (id && !existing)
            throw new types_1.HttpError(404, 'Leader not found', 'NOT_FOUND');
        const merged = { ...(existing || {}), ...data };
        (0, content_1.requireFields)(merged, [['name', 'Name'], ['designation', 'Designation']]);
        const values = [
            String(merged.name).trim(),
            String(merged.designation).trim(),
            ...LEADER_FIELDS.map((f) => (0, content_1.pickOptional)(merged, f)),
            Number(merged.display_order) || 0,
            (0, content_1.oneOf)(merged.status, ['ACTIVE', 'INACTIVE'], 'ACTIVE'),
        ];
        const db = await (0, database_1.getDbConnection)();
        if (id) {
            await db.query(`UPDATE tblLeaders SET name = ?, designation = ?, ${LEADER_FIELDS.map((f) => `${f} = ?`).join(', ')}, display_order = ?, status = ? WHERE id = ?`, [...values, id]);
            return this.getLeader(id);
        }
        const [res] = await db.query(`INSERT INTO tblLeaders (name, designation, ${LEADER_FIELDS.join(', ')}, display_order, status)
       VALUES (${new Array(values.length).fill('?').join(', ')})`, values);
        return this.getLeader(res.insertId);
    }
    static async deleteLeader(id) {
        const db = await (0, database_1.getDbConnection)();
        const [res] = await db.query('DELETE FROM tblLeaders WHERE id = ?', [id]);
        if (res.affectedRows === 0)
            throw new types_1.HttpError(404, 'Leader not found', 'NOT_FOUND');
    }
    static async listPages() {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT * FROM tblOrganization_pages ORDER BY page_key ASC');
        return rows;
    }
    static async getPage(pageKey) {
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT * FROM tblOrganization_pages WHERE page_key = ?', [pageKey]);
        return rows[0] || null;
    }
    static async savePage(pageKey, data) {
        if (!PAGE_KEY_PATTERN.test(pageKey)) {
            throw new types_1.HttpError(400, 'Page key may only contain lowercase letters, numbers, - and _', 'VALIDATION_ERROR', { field: 'page_key' });
        }
        (0, content_1.requireFields)(data, [['title', 'Title'], ['content', 'Content']]);
        const db = await (0, database_1.getDbConnection)();
        await db.query(`INSERT INTO tblOrganization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), title_ta = VALUES(title_ta), content = VALUES(content), content_ta = VALUES(content_ta)`, [pageKey, String(data.title).trim(), (0, content_1.pickOptional)(data, 'title_ta'), String(data.content), (0, content_1.pickOptional)(data, 'content_ta')]);
        return this.getPage(pageKey);
    }
}
exports.CmsService = CmsService;
