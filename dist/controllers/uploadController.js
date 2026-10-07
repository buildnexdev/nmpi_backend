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
const UPLOAD_ROOT = path_1.default.join(process.cwd(), 'uploads');
const MEDIA_DIR = path_1.default.join(UPLOAD_ROOT, 'media');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
function ensureMediaDir() {
    if (!fs_1.default.existsSync(MEDIA_DIR))
        fs_1.default.mkdirSync(MEDIA_DIR, { recursive: true });
}
function publicUrl(rel) {
    return `/${rel.replace(/\\/g, '/')}`;
}
function fileInfo(abs, rel) {
    const stat = fs_1.default.statSync(abs);
    return {
        filename: path_1.default.basename(abs),
        path: publicUrl(rel),
        url: publicUrl(rel),
        size: stat.size,
        updated_at: stat.mtime.toISOString(),
    };
}
function collectImages(dir, prefix, skipDirs) {
    if (!fs_1.default.existsSync(dir))
        return [];
    const out = [];
    for (const name of fs_1.default.readdirSync(dir)) {
        if (skipDirs.includes(name))
            continue;
        const abs = path_1.default.join(dir, name);
        const stat = fs_1.default.statSync(abs);
        if (stat.isDirectory())
            continue;
        if (!IMAGE_EXT.has(path_1.default.extname(name).toLowerCase()))
            continue;
        out.push(fileInfo(abs, path_1.default.join(prefix, name)));
    }
    return out;
}
async function listUploads(_req, res, next) {
    try {
        ensureMediaDir();
        const media = collectImages(MEDIA_DIR, 'uploads/media', []);
        const root = collectImages(UPLOAD_ROOT, 'uploads', ['media', 'profiles', 'qr']);
        const items = [...media, ...root].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
        return (0, response_1.sendSuccess)(res, 'Uploads retrieved', items);
    }
    catch (err) {
        next(err);
    }
}
async function createUpload(req, res, next) {
    try {
        const file = req.file;
        if (!file)
            return (0, response_1.sendError)(res, 'Choose an image file to upload.', 'VALIDATION_ERROR', 400);
        const rel = `uploads/media/${file.filename}`;
        return (0, response_1.sendSuccess)(res, 'File uploaded', {
            filename: file.filename,
            path: `/${rel}`,
            url: `/${rel}`,
            size: file.size,
        }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function deleteUpload(req, res, next) {
    try {
        const name = path_1.default.basename(req.params.filename || '');
        if (!name || name === '.' || name === '..') {
            return (0, response_1.sendError)(res, 'Invalid filename', 'VALIDATION_ERROR', 400);
        }
        const candidates = [path_1.default.join(MEDIA_DIR, name), path_1.default.join(UPLOAD_ROOT, name)];
        const target = candidates.find((p) => fs_1.default.existsSync(p) && fs_1.default.statSync(p).isFile());
        if (!target)
            return (0, response_1.sendError)(res, 'File not found', 'NOT_FOUND', 404);
        const resolved = path_1.default.resolve(target);
        if (!resolved.startsWith(path_1.default.resolve(UPLOAD_ROOT))) {
            return (0, response_1.sendError)(res, 'Invalid filename', 'VALIDATION_ERROR', 400);
        }
        if (resolved.includes(`${path_1.default.sep}profiles${path_1.default.sep}`) || resolved.includes(`${path_1.default.sep}qr${path_1.default.sep}`)) {
            return (0, response_1.sendError)(res, 'This file cannot be deleted here.', 'FORBIDDEN', 403);
        }
        fs_1.default.unlinkSync(resolved);
        return (0, response_1.sendSuccess)(res, 'File deleted', { filename: name });
    }
    catch (err) {
        next(err);
    }
}
