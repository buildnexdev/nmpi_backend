import { Request, Response, NextFunction } from 'express';
import { getDbConnection } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { SELF_SELECTABLE_ROLE_IDS } from '../constants';

function listHandler(message: string, buildQuery: (req: Request) => { sql: string; params: any[] } | string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const built = buildQuery(req);
      if (typeof built === 'string') return sendError(res, built, 'VALIDATION_ERROR', 400);
      const db = await getDbConnection();
      const [rows] = await db.query(built.sql, built.params);
      return sendSuccess(res, message, rows);
    } catch (err) {
      next(err);
    }
  };
}

export const getStates = listHandler('States retrieved successfully', () => ({
  sql: `SELECT id, name_en, name_ta, code FROM states WHERE status = 'ACTIVE' ORDER BY name_en ASC`,
  params: [],
}));

export const getParliaments = listHandler('Parliament constituencies retrieved successfully', (req) => ({
  sql: `SELECT id, state_id, name_en, name_ta, code FROM parliament_constituencies WHERE state_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`,
  params: [Number(req.query.stateId) || 1],
}));

export const getAssemblies = listHandler('Assembly constituencies retrieved successfully', (req) => {
  const parliamentId = Number(req.query.parliamentId) || null;
  return {
    sql: `SELECT id, parliament_constituency_id, name_en, name_ta FROM assembly_constituencies
          WHERE status = 'ACTIVE' ${parliamentId ? 'AND parliament_constituency_id = ?' : ''} ORDER BY name_en ASC`,
    params: parliamentId ? [parliamentId] : [],
  };
});

export const getDistricts = listHandler('Districts retrieved successfully', () => ({
  sql: `SELECT id, lgd_code, state_id, name_en, name_ta, code FROM districts WHERE status = 'ACTIVE' ORDER BY name_en ASC`,
  params: [],
}));

export const getBlocks = listHandler('Blocks retrieved successfully', (req) => {
  const districtId = Number(req.query.districtId);
  if (!districtId) return 'districtId is required';
  return {
    sql: `SELECT id, district_id, lgd_code, name_en, name_ta FROM blocks WHERE district_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`,
    params: [districtId],
  };
});

export const getVillages = listHandler('Villages retrieved successfully', (req) => {
  const blockId = Number(req.query.blockId);
  if (!blockId) return 'blockId is required';
  return {
    sql: `SELECT id, district_id, block_id, lgd_code, name_en, name_ta FROM villages WHERE block_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`,
    params: [blockId],
  };
});

export const getRoles = listHandler('Roles retrieved successfully', () => ({
  sql: `SELECT id, name, description FROM roles WHERE id IN (?) ORDER BY id ASC`,
  params: [SELF_SELECTABLE_ROLE_IDS],
}));

export const getAllRoles = listHandler('Roles retrieved successfully', () => ({
  sql: `SELECT id, name, description FROM roles ORDER BY id ASC`,
  params: [],
}));
