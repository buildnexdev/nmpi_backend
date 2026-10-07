import { getDbConnection } from '../config/database';
import { StaffScope } from './memberService';

export class DashboardService {
  static async getStatistics(scope: StaffScope | null) {
    const db = await getDbConnection();
    const scopeSql = scope ? `AND ${scope.column} = ?` : '';
    const scopeParams = scope ? [scope.value] : [];

    const [[statusRow]]: any = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(m.status = 'APPROVED') AS approved,
              SUM(m.status = 'PENDING') AS pending,
              SUM(m.status = 'SUSPENDED') AS suspended,
              SUM(m.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS last_30_days
       FROM tblMembers m WHERE 1=1 ${scopeSql}`,
      scopeParams
    );
    const [[eventsRow]]: any = await db.query("SELECT COUNT(*) AS c FROM tblEvents WHERE status = 'UPCOMING' AND event_date >= CURDATE()");
    const [[newsRow]]: any = await db.query("SELECT COUNT(*) AS c FROM tblNews WHERE status = 'PUBLISHED'");

    const [districtCounts]: any = await db.query(
      `SELECT d.id, d.name_en AS district_name, d.name_ta AS district_name_ta, COUNT(m.id) AS count
       FROM tblMembers m JOIN tblDistricts d ON d.id = m.district_id
       WHERE 1=1 ${scopeSql}
       GROUP BY d.id, d.name_en, d.name_ta ORDER BY count DESC LIMIT 10`,
      scopeParams
    );

    const [parliamentCounts]: any = await db.query(
      `SELECT pc.id, pc.name_en AS parliament_name, pc.name_ta AS parliament_name_ta, pc.code AS parliament_code, COUNT(m.id) AS count
       FROM tblMembers m JOIN tblParliament_constituencies pc ON pc.id = m.parliament_constituency_id
       WHERE 1=1 ${scopeSql}
       GROUP BY pc.id, pc.name_en, pc.name_ta, pc.code ORDER BY count DESC LIMIT 10`,
      scopeParams
    );

    const [roleCounts]: any = await db.query(
      `SELECT r.name AS role_name, COUNT(m.id) AS count
       FROM tblRoles r LEFT JOIN tblMembers m ON r.id = m.role_id ${scope ? `AND ${scope.column} = ?` : ''}
       GROUP BY r.id, r.name ORDER BY r.id`,
      scopeParams
    );

    const [monthly]: any = await db.query(
      `SELECT DATE_FORMAT(m.created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM tblMembers m
       WHERE m.created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH) ${scopeSql}
       GROUP BY month ORDER BY month`,
      scopeParams
    );

    const [recentMembers]: any = await db.query(
      `SELECT m.id, m.member_id, m.full_name, m.profile_image, m.status, m.created_at, d.name_en AS district_name
       FROM tblMembers m LEFT JOIN tblDistricts d ON d.id = m.district_id
       WHERE 1=1 ${scopeSql} ORDER BY m.id DESC LIMIT 6`,
      scopeParams
    );

    return {
      total_members: Number(statusRow.total) || 0,
      approved_members: Number(statusRow.approved) || 0,
      pending_applications: Number(statusRow.pending) || 0,
      suspended_members: Number(statusRow.suspended) || 0,
      new_last_30_days: Number(statusRow.last_30_days) || 0,
      upcoming_events: Number(eventsRow.c) || 0,
      published_news: Number(newsRow.c) || 0,
      district_counts: districtCounts.map((r: any) => ({ ...r, count: Number(r.count) })),
      parliament_counts: parliamentCounts.map((r: any) => ({ ...r, count: Number(r.count) })),
      role_counts: roleCounts.map((r: any) => ({ ...r, count: Number(r.count) })),
      monthly_registrations: monthly.map((r: any) => ({ ...r, count: Number(r.count) })),
      recent_members: recentMembers,
    };
  }
}
