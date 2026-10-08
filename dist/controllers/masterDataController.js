"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRoles = exports.getRoles = exports.getVillages = exports.getBlocks = exports.getDistricts = exports.getAssemblies = exports.getParliaments = exports.getStates = void 0;
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
const constants_1 = require("../constants");
function listHandler(message, buildQuery) {
    return async (req, res, next) => {
        try {
            const built = buildQuery(req);
            if (typeof built === 'string')
                return (0, response_1.sendError)(res, built, 'VALIDATION_ERROR', 400);
            const db = await (0, database_1.getDbConnection)();
            const [rows] = await db.query(built.sql, built.params);
            return (0, response_1.sendSuccess)(res, message, rows);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.getStates = listHandler('States retrieved successfully', () => ({
    sql: `SELECT id, name_en, name_ta, code FROM tblStates WHERE status = 'ACTIVE' ORDER BY name_en ASC`,
    params: [],
}));
exports.getParliaments = listHandler('Parliament constituencies retrieved successfully', (req) => {
    const stateId = Number(req.query.stateId);
    if (stateId > 0) {
        return {
            sql: `SELECT id, state_id, name_en, name_ta, code FROM tblParliament_constituencies WHERE state_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`,
            params: [stateId],
        };
    }
    return {
        sql: `SELECT id, state_id, name_en, name_ta, code FROM tblParliament_constituencies WHERE status = 'ACTIVE' ORDER BY name_en ASC`,
        params: [],
    };
});
exports.getAssemblies = listHandler('Assembly constituencies retrieved successfully', (req) => {
    const parliamentId = Number(req.query.parliamentId) || null;
    return {
        sql: `SELECT id, parliament_constituency_id, name_en, name_ta FROM tblAssembly_constituencies
          WHERE status = 'ACTIVE' ${parliamentId ? 'AND parliament_constituency_id = ?' : ''} ORDER BY name_en ASC`,
        params: parliamentId ? [parliamentId] : [],
    };
});
exports.getDistricts = listHandler('Districts retrieved successfully', () => ({
    sql: `SELECT id, lgd_code, state_id, name_en, name_ta, code FROM tblDistricts WHERE status = 'ACTIVE' ORDER BY name_en ASC`,
    params: [],
}));
exports.getBlocks = listHandler('Blocks retrieved successfully', (req) => {
    const districtId = Number(req.query.districtId);
    if (!districtId)
        return 'districtId is required';
    return {
        sql: `SELECT id, district_id, lgd_code, name_en, name_ta FROM tblBlocks WHERE district_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`,
        params: [districtId],
    };
});
exports.getVillages = listHandler('Villages retrieved successfully', (req) => {
    const blockId = Number(req.query.blockId);
    if (!blockId)
        return 'blockId is required';
    return {
        sql: `SELECT id, district_id, block_id, lgd_code, name_en, name_ta FROM tblVillages WHERE block_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`,
        params: [blockId],
    };
});
exports.getRoles = listHandler('Roles retrieved successfully', () => ({
    sql: `SELECT id, name, description FROM tblRoles WHERE id IN (?) ORDER BY id ASC`,
    params: [constants_1.SELF_SELECTABLE_ROLE_IDS],
}));
exports.getAllRoles = listHandler('Roles retrieved successfully', () => ({
    sql: `SELECT id, name, description FROM tblRoles ORDER BY id ASC`,
    params: [],
}));
