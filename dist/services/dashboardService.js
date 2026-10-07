"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const database_1 = require("../config/database");
class DashboardService {
    static async getStatistics() {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [totalMembersRow] = await db.query('SELECT COUNT(*) as count FROM tblMembers');
            const [pendingAppsRow] = await db.query("SELECT COUNT(*) as count FROM tblMembers WHERE status = 'PENDING'");
            const [approvedRow] = await db.query("SELECT COUNT(*) as count FROM tblMembers WHERE status = 'APPROVED'");
            const [eventsRow] = await db.query("SELECT COUNT(*) as count FROM tblEvents WHERE status = 'UPCOMING'");
            const [newsRow] = await db.query("SELECT COUNT(*) as count FROM tblNews WHERE status = 'PUBLISHED'");
            const [districtCounts] = await db.query(`
        SELECT d.id, d.name_en as district_name, d.name_ta as district_name_ta, COUNT(m.id) as count
        FROM tblDistricts d
        LEFT JOIN tblMembers m ON d.id = m.district_id
        GROUP BY d.id, d.name_en, d.name_ta
        HAVING count > 0
        ORDER BY count DESC
        LIMIT 10
      `);
            const [parliamentCounts] = await db.query(`
        SELECT pc.id, pc.name_en as parliament_name, pc.name_ta as parliament_name_ta, pc.code as parliament_code, COUNT(m.id) as count
        FROM tblParliament_constituencies pc
        LEFT JOIN tblMembers m ON pc.id = m.parliament_constituency_id
        GROUP BY pc.id, pc.name_en, pc.name_ta, pc.code
        ORDER BY count DESC, pc.name_en ASC
        LIMIT 15
      `);
            const [roleCounts] = await db.query(`
        SELECT r.name as role_name, COUNT(m.id) as count
        FROM tblRoles r
        LEFT JOIN tblMembers m ON r.id = m.role_id
        GROUP BY r.id, r.name
        ORDER BY count DESC
      `);
            const [newLast30] = await db.query("SELECT COUNT(*) as count FROM tblMembers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
            const [suspendedRow] = await db.query("SELECT COUNT(*) as count FROM tblMembers WHERE status = 'SUSPENDED'");
            const [monthly] = await db.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
        FROM tblMembers
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `);
            const [recent] = await db.query(`
        SELECT m.id, m.member_id, m.full_name, m.profile_image, m.status, m.created_at, d.name_en as district_name
        FROM tblMembers m
        LEFT JOIN tblDistricts d ON d.id = m.district_id
        ORDER BY m.created_at DESC
        LIMIT 8
      `);
            return {
                total_members: totalMembersRow[0].count,
                pending_applications: pendingAppsRow[0].count,
                approved_members: approvedRow[0].count,
                active_members: approvedRow[0].count,
                suspended_members: suspendedRow[0].count,
                new_last_30_days: newLast30[0].count,
                upcoming_events: eventsRow[0].count,
                published_news: newsRow[0].count,
                district_counts: districtCounts,
                parliament_counts: parliamentCounts,
                role_counts: roleCounts,
                monthly_registrations: monthly,
                recent_members: recent,
            };
        }
        else {
            const total_members = database_1.mockDbStore.members.length;
            const pending_applications = database_1.mockDbStore.members.filter(m => m.status === 'PENDING').length;
            const approved_members = database_1.mockDbStore.members.filter(m => m.status === 'APPROVED').length;
            const upcoming_events = database_1.mockDbStore.events.filter(e => e.status === 'UPCOMING').length;
            const published_news = database_1.mockDbStore.news.filter(n => n.status === 'PUBLISHED').length;
            return {
                total_members,
                pending_applications,
                approved_members,
                active_members: approved_members,
                upcoming_events,
                published_news,
                district_counts: [],
                parliament_counts: [],
                role_counts: [],
                monthly_registrations: [],
                recent_members: [],
                suspended_members: 0,
                new_last_30_days: 0,
            };
        }
    }
    static async getPublicStats() {
        const stats = await this.getStatistics();
        const db = await (0, database_1.getDbConnection)();
        let leaders = 0;
        let districts = 0;
        if (db) {
            const [leaderRows] = await db.query("SELECT COUNT(*) as count FROM tblLeaders WHERE status = 'ACTIVE'");
            const [districtRows] = await db.query("SELECT COUNT(*) as count FROM tblDistricts WHERE status = 'ACTIVE'");
            leaders = Number(leaderRows[0].count) || 0;
            districts = Number(districtRows[0].count) || 0;
        }
        return {
            members: Number(stats.approved_members) || 0,
            leaders,
            districts,
            upcoming_events: Number(stats.upcoming_events) || 0,
        };
    }
}
exports.DashboardService = DashboardService;
