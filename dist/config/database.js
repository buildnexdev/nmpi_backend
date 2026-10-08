"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPool = createPool;
exports.getDbConnection = getDbConnection;
exports.verifyDbConnection = verifyDbConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let pool = null;
function createPool() {
    if (!pool) {
        pool = promise_1.default.createPool({
            host: process.env.DATABASE_HOST || '127.0.0.1',
            port: Number(process.env.DATABASE_PORT) || 3306,
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || '',
            database: process.env.DATABASE_NAME || 'org_platform_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true,
            charset: 'utf8mb4',
        });
    }
    return pool;
}
async function getDbConnection() {
    return createPool();
}
async function verifyDbConnection() {
    const conn = await createPool().getConnection();
    conn.release();
}
