"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ROLE_PAGES = exports.PORTAL_PAGES = exports.ROLE_LABELS = exports.CONTENT_ROLE_CODES = exports.STAFF_ROLE_CODES = exports.ROLE_CODES = void 0;
exports.normalizeRoleCode = normalizeRoleCode;
exports.normalizeRoleCodes = normalizeRoleCodes;
exports.isStaff = isStaff;
exports.isContentAdmin = isContentAdmin;
exports.isSuperAdmin = isSuperAdmin;
exports.isPortalAdmin = isPortalAdmin;
/** Canonical role codes used in JWTs and RBAC checks. */
exports.ROLE_CODES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    DISTRICT_ADMIN: 'DISTRICT_ADMIN',
    TALUK_ADMIN: 'TALUK_ADMIN',
    UNIT_ADMIN: 'UNIT_ADMIN',
    VOLUNTEER: 'VOLUNTEER',
    MEMBER: 'MEMBER',
};
exports.STAFF_ROLE_CODES = [
    exports.ROLE_CODES.SUPER_ADMIN,
    exports.ROLE_CODES.ADMIN,
    exports.ROLE_CODES.DISTRICT_ADMIN,
    exports.ROLE_CODES.TALUK_ADMIN,
    exports.ROLE_CODES.UNIT_ADMIN,
];
exports.CONTENT_ROLE_CODES = [exports.ROLE_CODES.SUPER_ADMIN, exports.ROLE_CODES.ADMIN];
const ALIASES = {
    super_admin: exports.ROLE_CODES.SUPER_ADMIN,
    'super admin': exports.ROLE_CODES.SUPER_ADMIN,
    admin: exports.ROLE_CODES.ADMIN,
    district_admin: exports.ROLE_CODES.DISTRICT_ADMIN,
    district_coordinator: exports.ROLE_CODES.DISTRICT_ADMIN,
    'district coordinator': exports.ROLE_CODES.DISTRICT_ADMIN,
    taluk_admin: exports.ROLE_CODES.TALUK_ADMIN,
    taluk_coordinator: exports.ROLE_CODES.TALUK_ADMIN,
    'taluk coordinator': exports.ROLE_CODES.TALUK_ADMIN,
    unit_admin: exports.ROLE_CODES.UNIT_ADMIN,
    unit_coordinator: exports.ROLE_CODES.UNIT_ADMIN,
    'unit coordinator': exports.ROLE_CODES.UNIT_ADMIN,
    volunteer: exports.ROLE_CODES.VOLUNTEER,
    member: exports.ROLE_CODES.MEMBER,
};
exports.ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    DISTRICT_ADMIN: 'District Coordinator',
    TALUK_ADMIN: 'Taluk Coordinator',
    UNIT_ADMIN: 'Unit Coordinator',
    VOLUNTEER: 'Volunteer',
    MEMBER: 'Member',
};
function normalizeRoleCode(name) {
    if (!name)
        return '';
    const key = String(name).trim().toLowerCase().replace(/[\s-]+/g, ' ');
    const underscored = key.replace(/ /g, '_');
    return ALIASES[key] || ALIASES[underscored] || String(name).trim().toUpperCase().replace(/[\s-]+/g, '_');
}
function normalizeRoleCodes(roles) {
    return [...new Set((roles || []).map(normalizeRoleCode).filter(Boolean))];
}
function isStaff(roles) {
    return normalizeRoleCodes(roles).some((r) => exports.STAFF_ROLE_CODES.includes(r));
}
function isContentAdmin(roles) {
    return normalizeRoleCodes(roles).some((r) => exports.CONTENT_ROLE_CODES.includes(r));
}
function isSuperAdmin(roles) {
    return normalizeRoleCodes(roles).includes(exports.ROLE_CODES.SUPER_ADMIN);
}
function isPortalAdmin(roles) {
    const codes = normalizeRoleCodes(roles);
    return codes.includes(exports.ROLE_CODES.SUPER_ADMIN) || codes.includes(exports.ROLE_CODES.ADMIN);
}
/** Admin portal pages that can be granted per role. */
exports.PORTAL_PAGES = [
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
exports.DEFAULT_ROLE_PAGES = {
    SUPER_ADMIN: exports.PORTAL_PAGES.map((p) => p.key),
    ADMIN: exports.PORTAL_PAGES.map((p) => p.key),
    DISTRICT_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
    TALUK_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
    UNIT_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
    VOLUNTEER: ['account'],
    MEMBER: ['account'],
};
