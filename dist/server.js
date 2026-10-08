"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const schema_1 = require("./config/schema");
const PORT = Number(process.env.PORT) || 5000;
async function startServer() {
    await (0, database_1.verifyDbConnection)();
    await (0, schema_1.ensureSchema)((0, database_1.createPool)());
    console.log('Connected to MySQL and verified schema.');
    app_1.default.listen(PORT, () => {
        console.log(`Organization Platform API running on http://localhost:${PORT}/api (${process.env.NODE_ENV || 'development'})`);
    });
}
startServer().catch((err) => {
    console.error('Failed to start backend server. Is MySQL running and are the DATABASE_* values in .env correct?');
    console.error(err);
    process.exit(1);
});
