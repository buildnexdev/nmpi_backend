/** Canonical role codes used in JWTs and RBAC checks. */
export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DISTRICT_ADMIN: 'DISTRICT_ADMIN',
  TALUK_ADMIN: 'TALUK_ADMIN',
  UNIT_ADMIN: 'UNIT_ADMIN',
  VOLUNTEER: 'VOLUNTEER',
  MEMBER: 'MEMBER',
} as const;

export const STAFF_ROLE_CODES = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.DISTRICT_ADMIN,
  ROLE_CODES.TALUK_ADMIN,
  ROLE_CODES.UNIT_ADMIN,
];

export const CONTENT_ROLE_CODES = [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN];

const ALIASES: Record<string, string> = {
  super_admin: ROLE_CODES.SUPER_ADMIN,
  'super admin': ROLE_CODES.SUPER_ADMIN,
  admin: ROLE_CODES.ADMIN,
  district_admin: ROLE_CODES.DISTRICT_ADMIN,
  district_coordinator: ROLE_CODES.DISTRICT_ADMIN,
  'district coordinator': ROLE_CODES.DISTRICT_ADMIN,
  taluk_admin: ROLE_CODES.TALUK_ADMIN,
  taluk_coordinator: ROLE_CODES.TALUK_ADMIN,
  'taluk coordinator': ROLE_CODES.TALUK_ADMIN,
  unit_admin: ROLE_CODES.UNIT_ADMIN,
  unit_coordinator: ROLE_CODES.UNIT_ADMIN,
  'unit coordinator': ROLE_CODES.UNIT_ADMIN,
  volunteer: ROLE_CODES.VOLUNTEER,
  member: ROLE_CODES.MEMBER,
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DISTRICT_ADMIN: 'District Coordinator',
  TALUK_ADMIN: 'Taluk Coordinator',
  UNIT_ADMIN: 'Unit Coordinator',
  VOLUNTEER: 'Volunteer',
  MEMBER: 'Member',
};

export function normalizeRoleCode(name: string | null | undefined): string {
  if (!name) return '';
  const key = String(name).trim().toLowerCase().replace(/[\s-]+/g, ' ');
  const underscored = key.replace(/ /g, '_');
  return ALIASES[key] || ALIASES[underscored] || String(name).trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function normalizeRoleCodes(roles: string[] | null | undefined): string[] {
  return [...new Set((roles || []).map(normalizeRoleCode).filter(Boolean))];
}

export function isStaff(roles: string[] | null | undefined): boolean {
  return normalizeRoleCodes(roles).some((r) => (STAFF_ROLE_CODES as readonly string[]).includes(r));
}

export function isContentAdmin(roles: string[] | null | undefined): boolean {
  return normalizeRoleCodes(roles).some((r) => (CONTENT_ROLE_CODES as readonly string[]).includes(r));
}

export function isSuperAdmin(roles: string[] | null | undefined): boolean {
  return normalizeRoleCodes(roles).includes(ROLE_CODES.SUPER_ADMIN);
}

export function isPortalAdmin(roles: string[] | null | undefined): boolean {
  const codes = normalizeRoleCodes(roles);
  return codes.includes(ROLE_CODES.SUPER_ADMIN) || codes.includes(ROLE_CODES.ADMIN);
}

/** Admin portal pages that can be granted per role. */
export const PORTAL_PAGES: { key: string; label: string; section: string }[] = [
  { key: 'dashboard', label: 'Dashboard', section: 'Overview' },
  { key: 'members', label: 'Members', section: 'Membership' },
  { key: 'applications', label: 'Pending Approvals', section: 'Membership' },
  { key: 'reports', label: 'Reports & Export', section: 'Membership' },
  { key: 'news', label: 'News', section: 'Website Content' },
  { key: 'events', label: 'Events', section: 'Website Content' },
  { key: 'leadership', label: 'District Executives', section: 'Website Content' },
  { key: 'pages', label: 'Pages', section: 'Website Content' },
  { key: 'media', label: 'Media Library', section: 'Website Content' },
  { key: 'roles', label: 'Roles & Access', section: 'System' },
  { key: 'account', label: 'My Account', section: 'System' },
];

export const DEFAULT_ROLE_PAGES: Record<string, string[]> = {
  SUPER_ADMIN: PORTAL_PAGES.map((p) => p.key),
  ADMIN: PORTAL_PAGES.map((p) => p.key),
  DISTRICT_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
  TALUK_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
  UNIT_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
  VOLUNTEER: ['account'],
  MEMBER: ['account'],
};
