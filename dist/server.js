"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const schema_1 = require("./config/schema");
const PORT = Number(process.env.PORT) || 5000;
let dbReady = false;
let initPromise = null;
function ensureDbReady() {
    if (dbReady)
        return Promise.resolve();
    if (!initPromise) {
        initPromise = (async () => {
            await (0, database_1.verifyDbConnection)();
            await (0, schema_1.ensureSchema)((0, database_1.createPool)());
            dbReady = true;
            console.log('Connected to MySQL and verified schema.');
        })().catch((err) => {
            initPromise = null;
            throw err;
        });
    }
    return initPromise;
}
const serverApp = (0, express_1.default)();
// Bind HTTP port immediately so cloud hosts (e.g. Render) never stall on startup,
// while gating /api routes until MySQL + schema initialization completes.
serverApp.use('/api', async (_req, res, next) => {
    try {
        await ensureDbReady();
        next();
    }
    catch (err) {
        console.error('Database initialization failed:', err?.message || err);
        res.status(503).json({
            success: false,
            message: 'Backend database is unavailable. Please try again shortly.',
            data: null,
            error: {
                code: 'DB_UNAVAILABLE',
                detail: err?.message || 'Database connection failed',
            },
        });
    }
});
serverApp.use(app_1.default);
serverApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Organization Platform API listening on 0.0.0.0:${PORT}/api (${process.env.NODE_ENV || 'development'})`);
    ensureDbReady().catch((err) => {
        console.error('Initial MySQL connection/schema check failed. Will retry on incoming /api requests.');
        console.error(err);
    });
});
