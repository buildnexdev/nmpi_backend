"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.HTTP_STATUS = exports.MEMBER_STATUSES = exports.STAFF_ROLES = exports.CONTENT_ADMIN_ROLES = exports.SELF_SELECTABLE_ROLE_IDS = exports.ROLE_IDS = exports.ROLE_NAME_TO_CODE = exports.ROLES = void 0;
exports.ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    DISTRICT_ADMIN: 'DISTRICT_ADMIN',
    TALUK_ADMIN: 'TALUK_ADMIN',
    UNIT_ADMIN: 'UNIT_ADMIN',
    MEMBER: 'MEMBER',
};
// Maps `roles.name` values stored in MySQL to the role codes used for access control.
exports.ROLE_NAME_TO_CODE = {
    'Super Admin': exports.ROLES.SUPER_ADMIN,
    Admin: exports.ROLES.ADMIN,
    'District Coordinator': exports.ROLES.DISTRICT_ADMIN,
    'Taluk Coordinator': exports.ROLES.TALUK_ADMIN,
    'Unit Coordinator': exports.ROLES.UNIT_ADMIN,
    Volunteer: exports.ROLES.MEMBER,
    Member: exports.ROLES.MEMBER,
};
exports.ROLE_IDS = {
    MEMBER: 1,
    SUPER_ADMIN: 7,
};
// Roles a member may pick for themselves on the public registration form.
// Coordinator titles appear on QR-verified ID cards, so only staff may assign them.
exports.SELF_SELECTABLE_ROLE_IDS = [1, 2];
exports.CONTENT_ADMIN_ROLES = [exports.ROLES.SUPER_ADMIN, exports.ROLES.ADMIN];
exports.STAFF_ROLES = [exports.ROLES.SUPER_ADMIN, exports.ROLES.ADMIN, exports.ROLES.DISTRICT_ADMIN, exports.ROLES.TALUK_ADMIN, exports.ROLES.UNIT_ADMIN];
exports.MEMBER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER: 500,
};
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
};
