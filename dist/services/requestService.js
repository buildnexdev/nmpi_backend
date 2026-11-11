"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
class RequestService {
    static async generateRefNo() {
        const year = new Date().getFullYear();
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM tblPublic_requests');
        const count = (rows[0]?.total || 0) + 1;
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const padded = String(count).padStart(4, '0');
        return `NMPI-${year}-${padded}${randomSuffix.toString().slice(-2)}`;
    }
    static async createRequest(data) {
        const db = await (0, database_1.getDbConnection)();
        const ref_no = await this.generateRefNo();
        const submitted_at = new Date();
        const [result] = await db.query(`INSERT INTO tblPublic_requests 
       (ref_no, user_id, name, mobile, district_id, district_name, category, description, attachment_url, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)`, [
            ref_no,
            data.user_id || null,
            data.name.trim(),
            data.mobile.trim(),
            data.district_id || null,
            data.district_name || null,
            data.category.trim(),
            data.description.trim(),
            data.attachment_url || null,
            submitted_at,
        ]);
        return {
            id: result.insertId,
            ref_no,
            status: 'SUBMITTED',
            name: data.name,
            category: data.category,
            submitted_at,
        };
    }
    static async trackRequest(refNo) {
        const cleanRef = String(refNo || '').trim();
        if (!cleanRef) {
            throw new types_1.HttpError(400, 'Reference number is required', 'VALIDATION_ERROR');
        }
        const db = await (0, database_1.getDbConnection)();
        const [rows] = await db.query('SELECT * FROM tblPublic_requests WHERE ref_no = ? LIMIT 1', [cleanRef]);
        if (rows.length === 0) {
            throw new types_1.HttpError(404, `No request found with reference number ${cleanRef}`, 'NOT_FOUND');
        }
        const row = rows[0];
        const status = row.status || 'SUBMITTED';
        const order = ['SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED'];
        const currentIdx = order.indexOf(status);
        const steps = [
            {
                id: 'SUBMITTED',
                title: 'Submitted',
                title_ta: 'சமர்ப்பிக்கப்பட்டது',
                timestamp: row.submitted_at || row.created_at,
                isCompleted: currentIdx >= 0,
                isActive: currentIdx === 0,
            },
            {
                id: 'RECEIVED',
                title: 'Received',
                title_ta: 'பெறப்பட்டது',
                timestamp: row.received_at,
                isCompleted: currentIdx >= 1,
                isActive: currentIdx === 1,
            },
            {
                id: 'UNDER_REVIEW',
                title: 'Under review',
                title_ta: 'பரிசீலனையில் உள்ளது',
                timestamp: row.under_review_at,
                isCompleted: currentIdx >= 2,
                isActive: currentIdx === 2,
            },
            {
                id: 'ACTION_TAKEN',
                title: 'Action taken',
                title_ta: 'நடவடிக்கை எடுக்கப்பட்டது',
                timestamp: row.action_taken_at,
                isCompleted: currentIdx >= 3,
                isActive: currentIdx === 3,
            },
            {
                id: 'CLOSED',
                title: 'Closed',
                title_ta: 'நிறைவுற்றது',
                timestamp: row.closed_at,
                isCompleted: currentIdx >= 4,
                isActive: currentIdx === 4,
            },
        ];
        return {
            id: row.id,
            ref_no: row.ref_no,
            name: row.name,
            mobile: row.mobile,
            district_id: row.district_id,
            district_name: row.district_name,
            category: row.category,
            description: row.description,
            attachment_url: row.attachment_url,
            status: row.status,
            status_notes: row.status_notes,
            submitted_at: row.submitted_at,
            steps,
        };
    }
    static async listUserRequests(userId, mobile) {
        const db = await (0, database_1.getDbConnection)();
        let query = 'SELECT * FROM tblPublic_requests WHERE ';
        const params = [];
        if (userId && mobile) {
            query += '(user_id = ? OR mobile = ?)';
            params.push(userId, mobile);
        }
        else if (userId) {
            query += 'user_id = ?';
            params.push(userId);
        }
        else if (mobile) {
            query += 'mobile = ?';
            params.push(mobile);
        }
        else {
            return [];
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }
    static async listAllRequests(filters) {
        const db = await (0, database_1.getDbConnection)();
        const page = Math.max(1, filters.page || 1);
        const limit = Math.max(1, Math.min(100, filters.limit || 20));
        const offset = (page - 1) * limit;
        let whereSql = 'WHERE 1=1';
        const params = [];
        if (filters.status) {
            whereSql += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.search) {
            whereSql += ' AND (ref_no LIKE ? OR name LIKE ? OR mobile LIKE ? OR category LIKE ?)';
            const s = `%${filters.search}%`;
            params.push(s, s, s, s);
        }
        const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM tblPublic_requests ${whereSql}`, params);
        const total = countRows[0]?.total || 0;
        const [rows] = await db.query(`SELECT * FROM tblPublic_requests ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        return {
            items: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    static async updateStatus(id, status, notes) {
        const db = await (0, database_1.getDbConnection)();
        const allowed = ['SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED'];
        if (!allowed.includes(status)) {
            throw new types_1.HttpError(400, `Invalid status. Must be one of: ${allowed.join(', ')}`, 'VALIDATION_ERROR');
        }
        const now = new Date();
        let timestampCol = null;
        if (status === 'RECEIVED')
            timestampCol = 'received_at';
        else if (status === 'UNDER_REVIEW')
            timestampCol = 'under_review_at';
        else if (status === 'ACTION_TAKEN')
            timestampCol = 'action_taken_at';
        else if (status === 'CLOSED')
            timestampCol = 'closed_at';
        let updateSql = 'UPDATE tblPublic_requests SET status = ?, status_notes = COALESCE(?, status_notes)';
        const params = [status, notes || null];
        if (timestampCol) {
            updateSql += `, ${timestampCol} = COALESCE(${timestampCol}, ?)`;
            params.push(now);
        }
        updateSql += ' WHERE id = ?';
        params.push(id);
        await db.query(updateSql, params);
        return { success: true, status, notes };
    }
}
exports.RequestService = RequestService;
