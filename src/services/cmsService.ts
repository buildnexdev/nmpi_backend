import { getDbConnection, mockDbStore } from '../config/database';

export class CmsService {
  static async getLeaders() {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query("SELECT * FROM leaders WHERE status = 'ACTIVE' ORDER BY display_order ASC");
      return rows;
    } else {
      return mockDbStore.leaders.filter(l => l.status === 'ACTIVE');
    }
  }

  static async getPage(pageKey: string) {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query('SELECT * FROM organization_pages WHERE page_key = ?', [pageKey]);
      return rows[0] || null;
    } else {
      const p = (mockDbStore.organization_pages as any)[pageKey];
      if (!p) return null;
      return { page_key: pageKey, title: p.title, content: p.content };
    }
  }

  static async getGalleryAlbums() {
    const db = await getDbConnection();
    if (db) {
      const [rows]: any = await db.query("SELECT * FROM gallery_albums WHERE status = 'ACTIVE'");
      return rows;
    } else {
      return mockDbStore.gallery_albums;
    }
  }

  static async getGeography() {
    const db = await getDbConnection();
    if (db) {
      const [districts]: any = await db.query('SELECT * FROM districts');
      const [taluks]: any = await db.query('SELECT * FROM taluks');
      const [units]: any = await db.query('SELECT * FROM units');
      const [types]: any = await db.query('SELECT * FROM membership_types');
      return { districts, taluks, units, membership_types: types };
    } else {
      return {
        districts: mockDbStore.districts,
        taluks: mockDbStore.taluks,
        units: mockDbStore.units,
        membership_types: mockDbStore.membership_types,
      };
    }
  }
}
