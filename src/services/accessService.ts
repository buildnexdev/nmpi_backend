import { getDbConnection } from '../config/database';
import {
  DEFAULT_ROLE_PAGES,
  PORTAL_PAGES,
  ROLE_CODES,
  ROLE_LABELS,
  normalizeRoleCode,
  isPortalAdmin,
} from '../utils/roles';

async function ensureTable(db: any) {
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

  const [countRows]: any = await db.query('SELECT COUNT(*) as c FROM tblRole_page_access');
  if (countRows[0].c > 0) return;

  const [roles]: any = await db.query('SELECT id, name FROM tblRoles');
  for (const role of roles) {
    const code = normalizeRoleCode(role.name);
    const pages = DEFAULT_ROLE_PAGES[code] || ['account'];
    for (const page of PORTAL_PAGES) {
      await db.query(
        'INSERT IGNORE INTO tblRole_page_access (role_id, page_key, allowed) VALUES (?, ?, ?)',
        [role.id, page.key, pages.includes(page.key) ? 1 : 0]
      );
    }
  }
}

export class AccessService {
  static async getMatrix() {
    const db = await getDbConnection();
    if (!db) return { pages: PORTAL_PAGES, roles: [] };
    await ensureTable(db);

    const [roles]: any = await db.query('SELECT id, name, description FROM tblRoles ORDER BY id ASC');
    const [rows]: any = await db.query('SELECT role_id, page_key, allowed FROM tblRole_page_access');
    const [counts]: any = await db.query(
      `SELECT r.id as role_id, COUNT(m.id) as member_count
       FROM tblRoles r
       LEFT JOIN tblMembers m ON m.role_id = r.id
       GROUP BY r.id`
    );
    const countMap = Object.fromEntries(counts.map((c: any) => [c.role_id, Number(c.member_count)]));
    const byRole: Record<number, Record<string, boolean>> = {};
    for (const row of rows) {
      if (!byRole[row.role_id]) byRole[row.role_id] = {};
      byRole[row.role_id][row.page_key] = Boolean(row.allowed);
    }

    return {
      pages: PORTAL_PAGES,
      roles: roles.map((r: any) => {
        const code = normalizeRoleCode(r.name);
        const stored = byRole[r.id] || {};
        const access: Record<string, boolean> = {};
        for (const page of PORTAL_PAGES) {
          if (code === ROLE_CODES.SUPER_ADMIN) access[page.key] = true;
          else if (stored[page.key] !== undefined) access[page.key] = stored[page.key];
          else access[page.key] = (DEFAULT_ROLE_PAGES[code] || []).includes(page.key);
        }
        // Roles page is reserved for Admin + Super Admin
        if (code !== ROLE_CODES.SUPER_ADMIN && code !== ROLE_CODES.ADMIN) access.roles = false;
        if (code === ROLE_CODES.ADMIN || code === ROLE_CODES.SUPER_ADMIN) access.roles = true;
        access.account = true;
        return {
          id: r.id,
          name: r.name,
          code,
          label: ROLE_LABELS[code] || r.name,
          description: r.description,
          member_count: countMap[r.id] || 0,
          locked: code === ROLE_CODES.SUPER_ADMIN,
          access,
        };
      }),
    };
  }

  static async saveMatrix(items: { role_id: number; access: Record<string, boolean> }[], actorRoles: string[]) {
    if (!isPortalAdmin(actorRoles)) {
      throw Object.assign(new Error('Only Admin and Super Admin can change role access.'), { status: 403 });
    }
    const db = await getDbConnection();
    if (!db) throw new Error('Database connection unavailable.');
    await ensureTable(db);

    const [roles]: any = await db.query('SELECT id, name FROM tblRoles');
    const roleById = Object.fromEntries(roles.map((r: any) => [r.id, r]));

    for (const item of items) {
      const role = roleById[item.role_id];
      if (!role) continue;
      const code = normalizeRoleCode(role.name);
      if (code === ROLE_CODES.SUPER_ADMIN) continue; // always full access

      for (const page of PORTAL_PAGES) {
        let allowed = Boolean(item.access?.[page.key]);
        if (page.key === 'account') allowed = true;
        if (page.key === 'roles') allowed = code === ROLE_CODES.ADMIN;
        await db.query(
          `INSERT INTO tblRole_page_access (role_id, page_key, allowed)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)`,
          [item.role_id, page.key, allowed ? 1 : 0]
        );
      }
    }
    return this.getMatrix();
  }

  static async getPagesForRoleNames(roleNames: string[]): Promise<string[]> {
    const codes = [...new Set(roleNames.map(normalizeRoleCode))];
    if (codes.includes(ROLE_CODES.SUPER_ADMIN)) return PORTAL_PAGES.map((p) => p.key);
    const db = await getDbConnection();
    if (!db) {
      const pages = new Set<string>(['account']);
      for (const code of codes) (DEFAULT_ROLE_PAGES[code] || []).forEach((p) => pages.add(p));
      return [...pages];
    }
    await ensureTable(db);
    const [roles]: any = await db.query('SELECT id, name FROM tblRoles');
    const ids = roles.filter((r: any) => codes.includes(normalizeRoleCode(r.name))).map((r: any) => r.id);
    if (ids.length === 0) {
      const pages = new Set<string>(['account']);
      for (const code of codes) (DEFAULT_ROLE_PAGES[code] || []).forEach((p) => pages.add(p));
      if (codes.includes(ROLE_CODES.ADMIN)) pages.add('roles');
      return [...pages];
    }
    const [rows]: any = await db.query(
      `SELECT page_key FROM tblRole_page_access WHERE role_id IN (${ids.map(() => '?').join(',')}) AND allowed = 1`,
      ids
    );
    const pages = new Set<string>(['account']);
    rows.forEach((r: any) => pages.add(r.page_key));
    if (codes.includes(ROLE_CODES.ADMIN) || codes.includes(ROLE_CODES.SUPER_ADMIN)) pages.add('roles');
    else pages.delete('roles');
    return [...pages];
  }
}
