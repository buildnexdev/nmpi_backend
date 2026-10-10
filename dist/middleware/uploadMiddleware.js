"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaVideo = exports.uploadMediaImage = exports.uploadProfileImage = exports.DEFAULT_MEDIA_FOLDER = exports.MEDIA_FOLDERS = exports.VIDEO_MEDIA_FOLDER = exports.ALLOWED_VIDEO_EXTENSIONS = exports.ALLOWED_IMAGE_EXTENSIONS = exports.PROFILE_UPLOAD_DIR = exports.UPLOADS_ROOT = void 0;
exports.resolveMediaFolder = resolveMediaFolder;
exports.nextMediaFileName = nextMediaFileName;
exports.nextProfileFileName = nextProfileFileName;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fromEnv = (process.env.UPLOAD_DIR || '').trim();
exports.UPLOADS_ROOT = fromEnv
    ? path_1.default.resolve(fromEnv)
    : path_1.default.resolve(__dirname, '../../uploads');
exports.PROFILE_UPLOAD_DIR = path_1.default.join(exports.UPLOADS_ROOT, 'profiles');
exports.ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
exports.ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
exports.VIDEO_MEDIA_FOLDER = 'Videos';
/** Public media folders under uploads/ that staff can upload into from the admin app. */
exports.MEDIA_FOLDERS = ['Gallery', 'Events', 'News', 'Leaders', exports.VIDEO_MEDIA_FOLDER];
exports.DEFAULT_MEDIA_FOLDER = 'Gallery';
/** Case-insensitive match of a requested folder name; null when it isn't one of MEDIA_FOLDERS. */
function resolveMediaFolder(value) {
    if (typeof value !== 'string' || !value.trim())
        return null;
    return exports.MEDIA_FOLDERS.find((f) => f.toLowerCase() === value.trim().toLowerCase()) ?? null;
}
for (const dir of [exports.UPLOADS_ROOT, exports.PROFILE_UPLOAD_DIR, ...exports.MEDIA_FOLDERS.map((f) => path_1.default.join(exports.UPLOADS_ROOT, f))]) {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
}
const imageFileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (exports.ALLOWED_IMAGE_EXTENSIONS.includes(ext) && file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        const err = new Error('Invalid image file type. Only JPG, JPEG, PNG and WEBP are allowed.');
        err.code = 'INVALID_FILE_TYPE';
        cb(err);
    }
};
const videoFileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const okMime = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';
    if (exports.ALLOWED_VIDEO_EXTENSIONS.includes(ext) && okMime) {
        cb(null, true);
    }
    else {
        const err = new Error('Invalid video file type. Only MP4, WEBM and MOV are allowed.');
        err.code = 'INVALID_FILE_TYPE';
        cb(err);
    }
};
const memory = multer_1.default.memoryStorage();
/** IMG- / VID- YYYYMMDD-NNNNNN.ext, matching existing upload naming. */
function safeExt(originalName) {
    const ext = path_1.default.extname(String(originalName || '')).toLowerCase();
    return ext && ext.length <= 8 ? ext : '.jpg';
}
function nextMediaFileName(folder, originalName) {
    const ext = safeExt(originalName);
    const prefix = folder === exports.VIDEO_MEDIA_FOLDER ? 'VID' : 'IMG';
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `${prefix}-${stamp}-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}${ext}`;
}
function nextProfileFileName(originalName) {
    return `profile_${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt(originalName)}`;
}
exports.uploadProfileImage = (0, multer_1.default)({
    storage: memory,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
/** Accepts images for uploads/<folder>/ (Gallery, Events, News, Leaders). */
exports.uploadMediaImage = (0, multer_1.default)({
    storage: memory,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
/** Accepts videos for uploads/Videos/. */
exports.uploadMediaVideo = (0, multer_1.default)({
    storage: memory,
    fileFilter: videoFileFilter,
    limits: { fileSize: 80 * 1024 * 1024 },
});
