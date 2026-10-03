import { getDbConnection, mockDbStore } from '../config/database';

export class DashboardService {
  static async getStatistics() {
    const db = await getDbConnection();

    if (db) {
      const [totalMembersRow]: any = await db.query('SELECT COUNT(*) as count FROM members');
      const [pendingAppsRow]: any = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'PENDING'");
      const [approvedRow]: any = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'APPROVED'");
      const [eventsRow]: any = await db.query("SELECT COUNT(*) as count FROM events WHERE status = 'UPCOMING'");
      const [newsRow]: any = await db.query("SELECT COUNT(*) as count FROM news WHERE status = 'PUBLISHED'");

      const [districtCounts]: any = await db.query(`
        SELECT d.name_en as district_name, d.name_ta as district_name_ta, COUNT(m.id) as count
        FROM districts d
        LEFT JOIN members m ON d.id = m.district_id
        GROUP BY d.id, d.name_en, d.name_ta
        HAVING count > 0
        ORDER BY count DESC
        LIMIT 10
      `);

      const [parliamentCounts]: any = await db.query(`
        SELECT pc.id, pc.name_en as parliament_name, pc.name_ta as parliament_name_ta, pc.code as parliament_code, COUNT(m.id) as count
        FROM parliament_constituencies pc
        LEFT JOIN members m ON pc.id = m.parliament_constituency_id
        GROUP BY pc.id, pc.name_en, pc.name_ta, pc.code
        ORDER BY count DESC, pc.name_en ASC
        LIMIT 15
      `);

      const [roleCounts]: any = await db.query(`
        SELECT r.name as role_name, COUNT(m.id) as count
        FROM roles r
        LEFT JOIN members m ON r.id = m.role_id
        GROUP BY r.id, r.name
        ORDER BY count DESC
      `);

      return {
        total_members: totalMembersRow[0].count,
        pending_applications: pendingAppsRow[0].count,
        approved_members: approvedRow[0].count,
        active_members: approvedRow[0].count,
        upcoming_events: eventsRow[0].count,
        published_news: newsRow[0].count,
        district_counts: districtCounts,
        parliament_counts: parliamentCounts,
        role_counts: roleCounts
      };
    } else {
      const total_members = mockDbStore.members.length;
      const pending_applications = mockDbStore.members.filter(m => m.status === 'PENDING').length;
      const approved_members = mockDbStore.members.filter(m => m.status === 'APPROVED').length;
      const upcoming_events = mockDbStore.events.filter(e => e.status === 'UPCOMING').length;
      const published_news = mockDbStore.news.filter(n => n.status === 'PUBLISHED').length;

      return {
        total_members,
        pending_applications,
        approved_members,
        active_members: approved_members,
        upcoming_events,
        published_news,
        district_counts: [],
        parliament_counts: [],
        role_counts: []
      };
    }
  }
}
