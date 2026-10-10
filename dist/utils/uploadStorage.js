"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicUploadPath = publicUploadPath;
exports.parsePublicUploadPath = parsePublicUploadPath;
exports.storeUpload = storeUpload;
exports.removeUpload = removeUpload;
exports.removeStoredUpload = removeStoredUpload;
exports.readUploadBuffer = readUploadBuffer;
exports.fileBuffer = fileBuffer;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const types_1 = require("../types");
const s3Service_1 = require("../services/s3Service");
function publicUploadPath(folder, filename) {
    return `/uploads/${folder}/${filename}`;
}
function parsePublicUploadPath(stored) {
    const rel = String(stored || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
    const match = rel.match(/^uploads\/([^/]+)\/([^/]+)$/);
    if (!match)
        return null;
    return { folder: match[1], filename: match[2] };
}
function writeLocal(folder, filename, buffer) {
    const dir = path_1.default.join(uploadMiddleware_1.UPLOADS_ROOT, folder);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(path_1.default.join(dir, filename), buffer);
}
async function storeUpload(folder, filename, buffer, contentType) {
    if ((0, s3Service_1.isS3Enabled)()) {
        try {
            await (0, s3Service_1.uploadToS3)(`${folder}/${filename}`, buffer, contentType || 'application/octet-stream');
            return publicUploadPath(folder, filename);
        }
        catch (err) {
            console.error('S3 upload failed, saving on disk instead:', err?.name, err?.message);
            try {
                writeLocal(folder, filename, buffer);
                return publicUploadPath(folder, filename);
            }
            catch (diskErr) {
                throw new types_1.HttpError(503, `Could not save the photo (${err?.name || err?.Code || 'S3_ERROR'}: ${err?.message || 'upload failed'}; disk: ${diskErr?.message || 'failed'}).`, 'UPLOAD_ERROR');
            }
        }
    }
    try {
        writeLocal(folder, filename, buffer);
    }
    catch (err) {
        throw new types_1.HttpError(503, `Could not save the photo (${err?.message || 'disk write failed'}).`, 'UPLOAD_ERROR');
    }
    return publicUploadPath(folder, filename);
}
async function removeUpload(folder, filename) {
    if ((0, s3Service_1.isS3Enabled)()) {
        await (0, s3Service_1.deleteFromS3)(`${folder}/${filename}`);
        return;
    }
    const filePath = path_1.default.join(uploadMiddleware_1.UPLOADS_ROOT, folder, filename);
    if (fs_1.default.existsSync(filePath))
        fs_1.default.unlinkSync(filePath);
}
async function removeStoredUpload(stored) {
    const parsed = stored ? parsePublicUploadPath(stored) : null;
    if (!parsed)
        return;
    try {
        await removeUpload(parsed.folder, parsed.filename);
    }
    catch {
        /* already gone */
    }
}
async function readUploadBuffer(folder, filename) {
    if ((0, s3Service_1.isS3Enabled)())
        return (0, s3Service_1.getS3ObjectBuffer)(`${folder}/${filename}`);
    const filePath = path_1.default.join(uploadMiddleware_1.UPLOADS_ROOT, folder, filename);
    if (!fs_1.default.existsSync(filePath))
        return null;
    return fs_1.default.readFileSync(filePath);
}
function fileBuffer(file) {
    if (file.buffer?.length)
        return file.buffer;
    if (file.path && fs_1.default.existsSync(file.path))
        return fs_1.default.readFileSync(file.path);
    throw new types_1.HttpError(400, 'Profile photo is required.', 'VALIDATION_ERROR', { field: 'profile_image' });
}
