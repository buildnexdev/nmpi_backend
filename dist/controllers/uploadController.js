"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUploads = listUploads;
exports.createUpload = createUpload;
exports.deleteUpload = deleteUpload;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const response_1 = require("../utils/response");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const s3Service_1 = require("../services/s3Service");
const uploadStorage_1 = require("../utils/uploadStorage");
const UPLOAD_ROOT = path_1.default.join(process.cwd(), 'uploads');
const LEGACY_MEDIA_DIR = path_1.default.join(UPLOAD_ROOT, 'media');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
/** Loose files in uploads/ and the old uploads/media/ folder are reported under this name. */
const GENERAL_FOLDER = 'General';
/** Never listed or deletable here: member photos, profile pictures and QR codes are private. */
const PRIVATE_DIRS = ['Member', 'profiles', 'qr'];
const VIDEO_EXT = new Set([...uploadMiddleware_1.ALLOWED_VIDEO_EXTENSIONS]);
function kindOf(name) {
    return VIDEO_EXT.has(path_1.default.extname(name).toLowerCase()) ? 'video' : 'image';
}
function fileInfo(abs, rel, folder) {
    const stat = fs_1.default.statSync(abs);
    const url = `/${rel.replace(/\\/g, '/')}`;
    return {
        filename: path_1.default.basename(abs),
        folder,
        path: url,
        url,
        size: stat.size,
        updated_at: stat.mtime.toISOString(),
        kind: kindOf(abs),
    };
}
function collectMedia(dir, prefix, folder, allowed) {
    if (!fs_1.default.existsSync(dir))
        return [];
    const out = [];
    for (const name of fs_1.default.readdirSync(dir)) {
        const abs = path_1.default.join(dir, name);
        if (!fs_1.default.statSync(abs).isFile())
            continue;
        if (!allowed.has(path_1.default.extname(name).toLowerCase()))
            continue;
        out.push(fileInfo(abs, path_1.default.join(prefix, name), folder));
    }
    return out;
}
function collectImages(dir, prefix, folder) {
    return collectMedia(dir, prefix, folder, IMAGE_EXT);
}
function collectVideos(dir, prefix, folder) {
    return collectMedia(dir, prefix, folder, VIDEO_EXT);
}
function collectFolder(folder) {
    if (folder === GENERAL_FOLDER) {
        return [
            ...collectImages(UPLOAD_ROOT, 'uploads', GENERAL_FOLDER),
            ...collectImages(LEGACY_MEDIA_DIR, 'uploads/media', GENERAL_FOLDER),
        ];
    }
    if (folder === uploadMiddleware_1.VIDEO_MEDIA_FOLDER) {
        return collectVideos(path_1.default.join(UPLOAD_ROOT, folder), `uploads/${folder}`, folder);
    }
    return collectImages(path_1.default.join(UPLOAD_ROOT, folder), `uploads/${folder}`, folder);
}
function s3ItemToUpload(item) {
    return { ...item, kind: kindOf(item.filename) };
}
/** GET /api/uploads/list?folder=Gallery[,Events] — omit folder for every public folder. */
async function listUploads(req, res, next) {
    try {
        const allFolders = [...uploadMiddleware_1.MEDIA_FOLDERS, GENERAL_FOLDER];
        const requested = typeof req.query.folder === 'string' && req.query.folder.trim()
            ? req.query.folder.split(',').map((f) => allFolders.find((x) => x.toLowerCase() === f.trim().toLowerCase())).filter(Boolean)
            : allFolders;
        if ((0, s3Service_1.isS3Enabled)()) {
            const folders = requested.filter((f) => f !== GENERAL_FOLDER);
            const items = (await Promise.all(folders.map((folder) => (0, s3Service_1.listS3Folder)(folder))))
                .flat()
                .map(s3ItemToUpload)
                .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
            return (0, response_1.sendSuccess)(res, 'Uploads retrieved', items);
        }
        const items = requested.flatMap(collectFolder).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
        return (0, response_1.sendSuccess)(res, 'Uploads retrieved', items);
    }
    catch (err) {
        next(err);
    }
}
/** POST /api/uploads?folder=News — multipart field "file"; saved to uploads/<folder>/ or S3. */
async function createUpload(req, res, next) {
    try {
        const file = req.file;
        if (!file)
            return (0, response_1.sendError)(res, 'Choose a file to upload.', 'VALIDATION_ERROR', 400);
        const folder = (0, uploadMiddleware_1.resolveMediaFolder)(req.query.folder) ?? uploadMiddleware_1.DEFAULT_MEDIA_FOLDER;
        const filename = (0, uploadMiddleware_1.nextMediaFileName)(folder, file.originalname);
        const url = await (0, uploadStorage_1.storeUpload)(folder, filename, (0, uploadStorage_1.fileBuffer)(file), file.mimetype);
        return (0, response_1.sendSuccess)(res, 'File uploaded', {
            filename,
            folder,
            path: url,
            url,
            size: file.size,
        }, 201);
    }
    catch (err) {
        next(err);
    }
}
/** DELETE /api/uploads/:filename?folder=Gallery — without folder, the first public match is removed. */
async function deleteUpload(req, res, next) {
    try {
        const name = path_1.default.basename(req.params.filename || '');
        const ext = path_1.default.extname(name).toLowerCase();
        const allowedExt = IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext);
        if (!name || name === '.' || name === '..' || !allowedExt) {
            return (0, response_1.sendError)(res, 'Invalid filename', 'VALIDATION_ERROR', 400);
        }
        const folderParam = typeof req.query.folder === 'string' ? req.query.folder.trim() : '';
        const mediaFolder = (0, uploadMiddleware_1.resolveMediaFolder)(folderParam);
        if (folderParam && !mediaFolder && folderParam.toLowerCase() !== GENERAL_FOLDER.toLowerCase()) {
            return (0, response_1.sendError)(res, 'Unknown folder', 'VALIDATION_ERROR', 400);
        }
        if ((0, s3Service_1.isS3Enabled)()) {
            const folders = mediaFolder ? [mediaFolder] : [...uploadMiddleware_1.MEDIA_FOLDERS];
            for (const folder of folders) {
                if (await (0, s3Service_1.s3ObjectExists)(`${folder}/${name}`)) {
                    await (0, uploadStorage_1.removeUpload)(folder, name);
                    return (0, response_1.sendSuccess)(res, 'File deleted', { filename: name });
                }
            }
            return (0, response_1.sendError)(res, 'File not found', 'NOT_FOUND', 404);
        }
        const dirs = mediaFolder
            ? [path_1.default.join(UPLOAD_ROOT, mediaFolder)]
            : folderParam
                ? [UPLOAD_ROOT, LEGACY_MEDIA_DIR]
                : [...uploadMiddleware_1.MEDIA_FOLDERS.map((f) => path_1.default.join(UPLOAD_ROOT, f)), UPLOAD_ROOT, LEGACY_MEDIA_DIR];
        const target = dirs.map((dir) => path_1.default.join(dir, name)).find((p) => fs_1.default.existsSync(p) && fs_1.default.statSync(p).isFile());
        if (!target)
            return (0, response_1.sendError)(res, 'File not found', 'NOT_FOUND', 404);
        const resolved = path_1.default.resolve(target);
        const root = path_1.default.resolve(UPLOAD_ROOT);
        const relTop = path_1.default.relative(root, resolved).split(path_1.default.sep)[0];
        if (!resolved.startsWith(root + path_1.default.sep) || PRIVATE_DIRS.includes(relTop)) {
            return (0, response_1.sendError)(res, 'This file cannot be deleted here.', 'FORBIDDEN', 403);
        }
        fs_1.default.unlinkSync(resolved);
        return (0, response_1.sendSuccess)(res, 'File deleted', { filename: name });
    }
    catch (err) {
        next(err);
    }
}
