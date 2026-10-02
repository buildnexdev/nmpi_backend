"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsService = void 0;
const database_1 = require("../config/database");
class CmsService {
    static async getLeaders() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query("SELECT * FROM leaders WHERE status = 'ACTIVE' ORDER BY display_order ASC");
            return rows;
        }
        else {
            return database_1.mockDbStore.leaders.filter(l => l.status === 'ACTIVE');
        }
    }
    static async getPage(pageKey) {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT * FROM organization_pages WHERE page_key = ?', [pageKey]);
            return rows[0] || null;
        }
        else {
            const p = database_1.mockDbStore.organization_pages[pageKey];
            if (!p)
                return null;
            return { page_key: pageKey, title: p.title, content: p.content };
        }
    }
    static async getGalleryAlbums() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query("SELECT * FROM gallery_albums WHERE status = 'ACTIVE'");
            return rows;
        }
        else {
            return database_1.mockDbStore.gallery_albums;
        }
    }
    static async getGeography() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [districts] = await db.query('SELECT * FROM districts');
            const [taluks] = await db.query('SELECT * FROM taluks');
            const [units] = await db.query('SELECT * FROM units');
            const [types] = await db.query('SELECT * FROM membership_types');
            return { districts, taluks, units, membership_types: types };
        }
        else {
            return {
                districts: database_1.mockDbStore.districts,
                taluks: database_1.mockDbStore.taluks,
                units: database_1.mockDbStore.units,
                membership_types: database_1.mockDbStore.membership_types,
            };
        }
    }
}
exports.CmsService = CmsService;
