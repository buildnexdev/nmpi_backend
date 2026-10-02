"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
dotenv_1.default.config();
const PORT = Number(process.env.PORT) || 5000;
async function startServer() {
    await (0, database_1.getDbConnection)();
    app_1.default.listen(PORT, () => {
        console.log(`==================================================`);
        console.log(`🚀 Organization Platform Backend Running on Port ${PORT}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        console.log(`==================================================`);
    });
}
startServer().catch((err) => {
    console.error('Failed to launch backend server:', err);
});
