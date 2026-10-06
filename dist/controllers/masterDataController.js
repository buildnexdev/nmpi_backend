"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStates = getStates;
exports.getParliaments = getParliaments;
exports.getAssemblies = getAssemblies;
exports.getDistricts = getDistricts;
exports.getBlocks = getBlocks;
exports.getVillages = getVillages;
exports.getRoles = getRoles;
exports.getAllRoles = getAllRoles;
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
async function getStates(req, res, next) {
    try {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id, name_en, name_ta, code FROM tblStates WHERE status = 'ACTIVE' ORDER BY name_en ASC`);
            return (0, response_1.sendSuccess)(res, 'States retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'States retrieved successfully', [{ id: 1, name_en: 'Tamil Nadu', name_ta: 'தமிழ்நாடு', code: 'TN' }]);
    }
    catch (err) {
        next(err);
    }
}
async function getParliaments(req, res, next) {
    try {
        const stateId = Number(req.query.stateId) || 1;
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id, state_id, name_en, name_ta, code FROM tblParliament_constituencies WHERE state_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`, [stateId]);
            return (0, response_1.sendSuccess)(res, 'Parliament Constituencies retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'Parliament Constituencies retrieved', []);
    }
    catch (err) {
        next(err);
    }
}
async function getAssemblies(req, res, next) {
    try {
        const parliamentId = req.query.parliamentId ? Number(req.query.parliamentId) : null;
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            let query = `SELECT id, parliament_constituency_id, name_en, name_ta FROM tblAssembly_constituencies WHERE status = 'ACTIVE'`;
            const params = [];
            if (parliamentId) {
                query += ` AND parliament_constituency_id = ?`;
                params.push(parliamentId);
            }
            query += ` ORDER BY name_en ASC`;
            const [rows] = await db.query(query, params);
            return (0, response_1.sendSuccess)(res, 'Assembly Constituencies retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'Assembly Constituencies retrieved', []);
    }
    catch (err) {
        next(err);
    }
}
async function getDistricts(req, res, next) {
    try {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id, lgd_code, state_id, name_en, name_ta, code FROM tblDistricts WHERE status = 'ACTIVE' ORDER BY name_en ASC`);
            return (0, response_1.sendSuccess)(res, 'Districts retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'Districts retrieved', []);
    }
    catch (err) {
        next(err);
    }
}
async function getBlocks(req, res, next) {
    try {
        const districtId = req.query.districtId ? Number(req.query.districtId) : null;
        if (!districtId) {
            return (0, response_1.sendError)(res, 'districtId is required', 'VALIDATION_ERROR', 400);
        }
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id, district_id, lgd_code, name_en, name_ta FROM tblBlocks WHERE district_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`, [districtId]);
            return (0, response_1.sendSuccess)(res, 'Blocks retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'Blocks retrieved', []);
    }
    catch (err) {
        next(err);
    }
}
async function getVillages(req, res, next) {
    try {
        const blockId = req.query.blockId ? Number(req.query.blockId) : null;
        if (!blockId) {
            return (0, response_1.sendError)(res, 'blockId is required', 'VALIDATION_ERROR', 400);
        }
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query(`SELECT id, district_id, block_id, lgd_code, name_en, name_ta FROM tblVillages WHERE block_id = ? AND status = 'ACTIVE' ORDER BY name_en ASC`, [blockId]);
            return (0, response_1.sendSuccess)(res, 'Villages retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'Villages retrieved', []);
    }
    catch (err) {
        next(err);
    }
}
async function getRoles(req, res, next) {
    try {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            // Exclude SUPER_ADMIN and ADMIN for public self-registration
            const [rows] = await db.query(`SELECT id, name, description FROM tblRoles WHERE name NOT IN ('Super Admin', 'SUPER_ADMIN', 'ADMIN', 'Admin') ORDER BY id ASC`);
            return (0, response_1.sendSuccess)(res, 'Roles retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'Roles retrieved', [
            { id: 1, name: 'Member', description: 'Standard Organization Member' },
            { id: 2, name: 'Volunteer', description: 'Active Community Volunteer' },
            { id: 3, name: 'Unit Coordinator', description: 'Coordinator for Local Village/Ward Unit' },
            { id: 4, name: 'Taluk Coordinator', description: 'Coordinator for Taluk / Block Division' },
            { id: 5, name: 'District Coordinator', description: 'Coordinator for District Level Division' }
        ]);
    }
    catch (err) {
        next(err);
    }
}
async function getAllRoles(_req, res, next) {
    try {
        const db = await (0, database_1.getDbConnection)();
        if (db) {
            const [rows] = await db.query('SELECT id, name, description FROM tblRoles ORDER BY id ASC');
            return (0, response_1.sendSuccess)(res, 'Roles retrieved successfully', rows);
        }
        return (0, response_1.sendSuccess)(res, 'Roles retrieved', [
            { id: 1, name: 'Member', description: 'Standard Organization Member' },
            { id: 2, name: 'Volunteer', description: 'Active Community Volunteer' },
            { id: 3, name: 'Unit Coordinator', description: 'Coordinator for Local Village/Ward Unit' },
            { id: 4, name: 'Taluk Coordinator', description: 'Coordinator for Taluk / Block Division' },
            { id: 5, name: 'District Coordinator', description: 'Coordinator for District Level Division' },
            { id: 6, name: 'Admin', description: 'Organisation administrator' },
            { id: 7, name: 'Super Admin', description: 'Full system access' },
        ]);
    }
    catch (err) {
        next(err);
    }
}
