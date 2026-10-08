"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const roles_1 = require("../utils/roles");
async function ensureTable(db) {
    await db.query(`
    CREATE TABLE IF NOT EXISTS tblRole_page_access (
      id int(11) NOT NULL AUTO_INCREMENT,
      role_id int(11) NOT NULL,
      page_key varchar(50) NOT NULL,
      allowed tinyint(1) NOT NULL DEFAULT 1,
      PRIMARY KEY (id),
      UNIQUE KEY uk_role_page (role_id, page_key),
      KEY role_id (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    const [countRows] = await db.query('SELECT COUNT(*) as c FROM tblRole_page_access');
    if (countRows[0].c > 0)
        return;
    const [roles] = await db.query('SELECT id, name FROM tblRoles');
    for (const role of roles) {
        const code = (0, roles_1.normalizeRoleCode)(role.name);
        const pages = roles_1.DEFAULT_ROLE_PAGES[code] || ['account'];
        for (const page of roles_1.PORTAL_PAGES) {
            await db.query('INSERT IGNORE INTO tblRole_page_access (role_id, page_key, allowed) VALUES (?, ?, ?)', [role.id, page.key, pages.includes(page.key) ? 1 : 0]);
        }
    }
}
class AccessService {
    static async getMatrix() {
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            return { pages: roles_1.PORTAL_PAGES, roles: [] };
        await ensureTable(db);
        const [roles] = await db.query('SELECT id, name, description FROM tblRoles ORDER BY id ASC');
        const [rows] = await db.query('SELECT role_id, page_key, allowed FROM tblRole_page_access');
        const [counts] = await db.query(`SELECT r.id as role_id, COUNT(m.id) as member_count
       FROM tblRoles r
       LEFT JOIN tblMembers m ON m.role_id = r.id
       GROUP BY r.id`);
        const countMap = Object.fromEntries(counts.map((c) => [c.role_id, Number(c.member_count)]));
        const byRole = {};
        for (const row of rows) {
            if (!byRole[row.role_id])
                byRole[row.role_id] = {};
            byRole[row.role_id][row.page_key] = Boolean(row.allowed);
        }
        return {
            pages: roles_1.PORTAL_PAGES,
            roles: roles.map((r) => {
                const code = (0, roles_1.normalizeRoleCode)(r.name);
                const stored = byRole[r.id] || {};
                const access = {};
                for (const page of roles_1.PORTAL_PAGES) {
                    if (code === roles_1.ROLE_CODES.SUPER_ADMIN)
                        access[page.key] = true;
                    else if (stored[page.key] !== undefined)
                        access[page.key] = stored[page.key];
                    else
                        access[page.key] = (roles_1.DEFAULT_ROLE_PAGES[code] || []).includes(page.key);
                }
                // Roles page is reserved for Admin + Super Admin
                if (code !== roles_1.ROLE_CODES.SUPER_ADMIN && code !== roles_1.ROLE_CODES.ADMIN)
                    access.roles = false;
                if (code === roles_1.ROLE_CODES.ADMIN || code === roles_1.ROLE_CODES.SUPER_ADMIN)
                    access.roles = true;
                access.account = true;
                return {
                    id: r.id,
                    name: r.name,
                    code,
                    label: roles_1.ROLE_LABELS[code] || r.name,
                    description: r.description,
                    member_count: countMap[r.id] || 0,
                    locked: code === roles_1.ROLE_CODES.SUPER_ADMIN,
                    access,
                };
            }),
        };
    }
    static async saveMatrix(items, actorRoles) {
        if (!(0, roles_1.isPortalAdmin)(actorRoles)) {
            throw new types_1.HttpError(403, 'Only Admin and Super Admin can change role access.', 'FORBIDDEN');
        }
        const db = await (0, database_1.getDbConnection)();
        if (!db)
            throw new Error('Database connection unavailable.');
        await ensureTable(db);
        const [roles] = await db.query('SELECT id, name FROM tblRoles');
        const roleById = Object.fromEntries(roles.map((r) => [r.id, r]));
        for (const item of items) {
            const role = roleById[item.role_id];
            if (!role)
                continue;
            const code = (0, roles_1.normalizeRoleCode)(role.name);
            if (code === roles_1.ROLE_CODES.SUPER_ADMIN)
                continue; // always full access
            for (const page of roles_1.PORTAL_PAGES) {
                let allowed = Boolean(item.access?.[page.key]);
                if (page.key === 'account')
                    allowed = true;
                if (page.key === 'roles')
                    allowed = code === roles_1.ROLE_CODES.ADMIN;
                await db.query(`INSERT INTO tblRole_page_access (role_id, page_key, allowed)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)`, [item.role_id, page.key, allowed ? 1 : 0]);
            }
        }
        return this.getMatrix();
    }
    static async getPagesForRoleNames(roleNames) {
        const codes = [...new Set(roleNames.map(roles_1.normalizeRoleCode))];
        if (codes.includes(roles_1.ROLE_CODES.SUPER_ADMIN))
            return roles_1.PORTAL_PAGES.map((p) => p.key);
        const db = await (0, database_1.getDbConnection)();
        if (!db) {
            const pages = new Set(['account']);
            for (const code of codes)
                (roles_1.DEFAULT_ROLE_PAGES[code] || []).forEach((p) => pages.add(p));
            return [...pages];
        }
        await ensureTable(db);
        const [roles] = await db.query('SELECT id, name FROM tblRoles');
        const ids = roles.filter((r) => codes.includes((0, roles_1.normalizeRoleCode)(r.name))).map((r) => r.id);
        if (ids.length === 0) {
            const pages = new Set(['account']);
            for (const code of codes)
                (roles_1.DEFAULT_ROLE_PAGES[code] || []).forEach((p) => pages.add(p));
            if (codes.includes(roles_1.ROLE_CODES.ADMIN))
                pages.add('roles');
            return [...pages];
        }
        const [rows] = await db.query(`SELECT page_key FROM tblRole_page_access WHERE role_id IN (${ids.map(() => '?').join(',')}) AND allowed = 1`, ids);
        const pages = new Set(['account']);
        rows.forEach((r) => pages.add(r.page_key));
        if (codes.includes(roles_1.ROLE_CODES.ADMIN) || codes.includes(roles_1.ROLE_CODES.SUPER_ADMIN))
            pages.add('roles');
        else
            pages.delete('roles');
        return [...pages];
    }
}
exports.AccessService = AccessService;
