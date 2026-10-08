"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const memberRoutes_1 = __importDefault(require("./routes/memberRoutes"));
const masterDataRoutes_1 = __importDefault(require("./routes/masterDataRoutes"));
const newsRoutes_1 = __importDefault(require("./routes/newsRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const verifyRoutes_1 = __importDefault(require("./routes/verifyRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const cmsRoutes_1 = __importDefault(require("./routes/cmsRoutes"));
const accessRoutes_1 = __importDefault(require("./routes/accessRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({ origin: '*', exposedHeaders: ['Content-Disposition'] }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('dev'));
app.use('/api/', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests, please try again later.', data: null },
}));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'NMPI Platform API', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/members', memberRoutes_1.default);
app.use('/api/master-data', masterDataRoutes_1.default);
app.use('/api/news', newsRoutes_1.default);
app.use('/api/events', eventRoutes_1.default);
app.use('/api/verify', verifyRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/access', accessRoutes_1.default);
app.use('/api/uploads', uploadRoutes_1.default);
app.use('/api', cmsRoutes_1.default);
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found`, data: null, error: { code: 'NOT_FOUND' } });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
