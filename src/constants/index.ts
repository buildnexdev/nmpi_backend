export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DISTRICT_ADMIN: 'DISTRICT_ADMIN',
  TALUK_ADMIN: 'TALUK_ADMIN',
  UNIT_ADMIN: 'UNIT_ADMIN',
  MEMBER: 'MEMBER',
};

// Maps `roles.name` values stored in MySQL to the role codes used for access control.
export const ROLE_NAME_TO_CODE: Record<string, string> = {
  'Super Admin': ROLES.SUPER_ADMIN,
  Admin: ROLES.ADMIN,
  'District Coordinator': ROLES.DISTRICT_ADMIN,
  'Taluk Coordinator': ROLES.TALUK_ADMIN,
  'Unit Coordinator': ROLES.UNIT_ADMIN,
  Volunteer: ROLES.MEMBER,
  Member: ROLES.MEMBER,
};

export const ROLE_IDS = {
  MEMBER: 1,
  SUPER_ADMIN: 7,
};

// Roles a member may pick for themselves on the public registration form.
// Coordinator titles appear on QR-verified ID cards, so only staff may assign them.
export const SELF_SELECTABLE_ROLE_IDS = [1, 2];

export const CONTENT_ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
export const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRICT_ADMIN, ROLES.TALUK_ADMIN, ROLES.UNIT_ADMIN];

export const MEMBER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
};
