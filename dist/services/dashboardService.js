"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const database_1 = require("../config/database");
class DashboardService {
    static async getStatistics() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [totalMembersRow] = await db.query('SELECT COUNT(*) as count FROM members');
            const [pendingAppsRow] = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'PENDING'");
            const [approvedRow] = await db.query("SELECT COUNT(*) as count FROM members WHERE status = 'APPROVED'");
            const [eventsRow] = await db.query("SELECT COUNT(*) as count FROM events WHERE status = 'UPCOMING'");
            const [newsRow] = await db.query("SELECT COUNT(*) as count FROM news WHERE status = 'PUBLISHED'");
            const [districtCounts] = await db.query(`
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
        }
        else {
            const total_members = database_1.mockDbStore.members.length;
            const pending_applications = database_1.mockDbStore.members.filter(m => m.status === 'PENDING').length;
            const approved_members = database_1.mockDbStore.members.filter(m => m.status === 'APPROVED').length;
            const upcoming_events = database_1.mockDbStore.events.filter(e => e.status === 'UPCOMING').length;
            const published_news = database_1.mockDbStore.news.filter(n => n.status === 'PUBLISHED').length;
            const district_counts = database_1.mockDbStore.districts.map(d => {
                const count = database_1.mockDbStore.members.filter(m => m.district_id === d.id).length;
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
exports.DashboardService = DashboardService;
