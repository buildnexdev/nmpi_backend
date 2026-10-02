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
        SELECT d.name as district_name, COUNT(m.id) as count
        FROM districts d
        LEFT JOIN members m ON d.id = m.district_id
        GROUP BY d.id, d.name
      `);

      return {
        total_members: totalMembersRow[0].count,
        pending_applications: pendingAppsRow[0].count,
        approved_members: approvedRow[0].count,
        active_members: approvedRow[0].count,
        upcoming_events: eventsRow[0].count,
        published_news: newsRow[0].count,
        district_counts: districtCounts,
      };
    } else {
      const total_members = mockDbStore.members.length;
      const pending_applications = mockDbStore.members.filter(m => m.status === 'PENDING').length;
      const approved_members = mockDbStore.members.filter(m => m.status === 'APPROVED').length;
      const upcoming_events = mockDbStore.events.filter(e => e.status === 'UPCOMING').length;
      const published_news = mockDbStore.news.filter(n => n.status === 'PUBLISHED').length;

      const district_counts = mockDbStore.districts.map(d => {
        const count = mockDbStore.members.filter(m => m.district_id === d.id).length;
        return { district_name: d.name, count };
      });

      return {
        total_members,
        pending_applications,
        approved_members,
        active_members: approved_members,
        upcoming_events,
        published_news,
        district_counts,
      };
    }
  }
}
