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
const feedRoutes_1 = __importDefault(require("./routes/feedRoutes"));
const reelRoutes_1 = __importDefault(require("./routes/reelRoutes"));
const surveyRoutes_1 = __importDefault(require("./routes/surveyRoutes"));
const requestRoutes_1 = __importDefault(require("./routes/requestRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const uploadsServe_1 = require("./middleware/uploadsServe");
const s3Service_1 = require("./services/s3Service");
const app = (0, express_1.default)();
// Render runs behind a reverse proxy — trust it for correct IP detection
app.set('trust proxy', 1);
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
app.get('/uploads/:folder/:filename', uploadsServe_1.serveUpload);
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.get('/health', async (req, res) => {
    let s3Probe = { enabled: (0, s3Service_1.isS3Enabled)() };
    if ((0, s3Service_1.isS3Enabled)()) {
        try {
            const probeKey = 'Gallery/IMG-20261012-345378.jpg';
            const testResult = await (0, s3Service_1.testS3Get)(probeKey);
            s3Probe = {
                enabled: true,
                bucket: process.env.AWS_S3_BUCKET,
                region: process.env.AWS_REGION || process.env.AWS_S3_REGION || 'ap-south-1',
                testKey: probeKey,
                result: testResult,
            };
        }
        catch (err) {
            s3Probe = {
                enabled: true,
                error: `${err?.name}: ${err?.message}`,
            };
        }
    }
    res.json({
        status: 'UP',
        service: 'NMPI Platform API',
        build: 's3-exact-probe-v5',
        s3: s3Probe,
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/members', memberRoutes_1.default);
app.use('/api/master-data', masterDataRoutes_1.default);
app.use('/api/news', newsRoutes_1.default);
app.use('/api/events', eventRoutes_1.default);
app.use('/api/feed', feedRoutes_1.default);
app.use('/api/reels', reelRoutes_1.default);
app.use('/api/surveys', surveyRoutes_1.default);
app.use('/api/requests', requestRoutes_1.default);
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
