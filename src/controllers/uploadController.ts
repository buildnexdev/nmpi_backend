import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { sendSuccess, sendError } from '../utils/response';
import {
  ALLOWED_VIDEO_EXTENSIONS,
  DEFAULT_MEDIA_FOLDER,
  MEDIA_FOLDERS,
  nextMediaFileName,
  resolveMediaFolder,
  VIDEO_MEDIA_FOLDER,
} from '../middleware/uploadMiddleware';
import { isS3Enabled, listS3Folder, s3ObjectExists } from '../services/s3Service';
import { fileBuffer, removeUpload, storeUpload } from '../utils/uploadStorage';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const LEGACY_MEDIA_DIR = path.join(UPLOAD_ROOT, 'media');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
/** Loose files in uploads/ and the old uploads/media/ folder are reported under this name. */
const GENERAL_FOLDER = 'General';
/** Never listed or deletable here: member photos, profile pictures and QR codes are private. */
const PRIVATE_DIRS = ['Member', 'profiles', 'qr'];

type UploadItem = {
  filename: string;
  folder: string;
  path: string;
  url: string;
  size: number;
  updated_at: string;
  kind: 'image' | 'video';
};

const VIDEO_EXT = new Set([...ALLOWED_VIDEO_EXTENSIONS]);

function kindOf(name: string): 'image' | 'video' {
  return VIDEO_EXT.has(path.extname(name).toLowerCase()) ? 'video' : 'image';
}

function fileInfo(abs: string, rel: string, folder: string): UploadItem {
  const stat = fs.statSync(abs);
  const url = `/${rel.replace(/\\/g, '/')}`;
  return {
    filename: path.basename(abs),
    folder,
    path: url,
    url,
    size: stat.size,
    updated_at: stat.mtime.toISOString(),
    kind: kindOf(abs),
  };
}

function collectMedia(dir: string, prefix: string, folder: string, allowed: Set<string>): UploadItem[] {
  if (!fs.existsSync(dir)) return [];
  const out: UploadItem[] = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (!fs.statSync(abs).isFile()) continue;
    if (!allowed.has(path.extname(name).toLowerCase())) continue;
    out.push(fileInfo(abs, path.join(prefix, name), folder));
  }
  return out;
}

function collectImages(dir: string, prefix: string, folder: string): UploadItem[] {
  return collectMedia(dir, prefix, folder, IMAGE_EXT);
}

function collectVideos(dir: string, prefix: string, folder: string): UploadItem[] {
  return collectMedia(dir, prefix, folder, VIDEO_EXT);
}

function collectFolder(folder: string): UploadItem[] {
  if (folder === GENERAL_FOLDER) {
    return [
      ...collectImages(UPLOAD_ROOT, 'uploads', GENERAL_FOLDER),
      ...collectImages(LEGACY_MEDIA_DIR, 'uploads/media', GENERAL_FOLDER),
    ];
  }
  if (folder === VIDEO_MEDIA_FOLDER) {
    return collectVideos(path.join(UPLOAD_ROOT, folder), `uploads/${folder}`, folder);
  }
  return collectImages(path.join(UPLOAD_ROOT, folder), `uploads/${folder}`, folder);
}

function s3ItemToUpload(item: {
  filename: string;
  folder: string;
  path: string;
  url: string;
  size: number;
  updated_at: string;
}): UploadItem {
  return { ...item, kind: kindOf(item.filename) };
}

/** GET /api/uploads/list?folder=Gallery[,Events] — omit folder for every public folder. */
export async function listUploads(req: Request, res: Response, next: NextFunction) {
  try {
    const allFolders = [...MEDIA_FOLDERS, GENERAL_FOLDER];
    const requested = typeof req.query.folder === 'string' && req.query.folder.trim()
      ? req.query.folder.split(',').map((f) => allFolders.find((x) => x.toLowerCase() === f.trim().toLowerCase())).filter(Boolean) as string[]
      : allFolders;

    if (isS3Enabled()) {
      const folders = requested.filter((f) => f !== GENERAL_FOLDER);
      const items = (await Promise.all(folders.map((folder) => listS3Folder(folder))))
        .flat()
        .map(s3ItemToUpload)
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
      return sendSuccess(res, 'Uploads retrieved', items);
    }

    const items = requested.flatMap(collectFolder).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    return sendSuccess(res, 'Uploads retrieved', items);
  } catch (err) {
    next(err);
  }
}

/** POST /api/uploads?folder=News — multipart field "file"; saved to uploads/<folder>/ or S3. */
export async function createUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return sendError(res, 'Choose a file to upload.', 'VALIDATION_ERROR', 400);
    const folder = resolveMediaFolder(req.query.folder) ?? DEFAULT_MEDIA_FOLDER;
    const filename = nextMediaFileName(folder, file.originalname);
    const url = await storeUpload(folder, filename, fileBuffer(file), file.mimetype);
    return sendSuccess(res, 'File uploaded', {
      filename,
      folder,
      path: url,
      url,
      size: file.size,
    }, 201);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/uploads/:filename?folder=Gallery — without folder, the first public match is removed. */
export async function deleteUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const name = path.basename(req.params.filename || '');
    const ext = path.extname(name).toLowerCase();
    const allowedExt = IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext);
    if (!name || name === '.' || name === '..' || !allowedExt) {
      return sendError(res, 'Invalid filename', 'VALIDATION_ERROR', 400);
    }
    const folderParam = typeof req.query.folder === 'string' ? req.query.folder.trim() : '';
    const mediaFolder = resolveMediaFolder(folderParam);
    if (folderParam && !mediaFolder && folderParam.toLowerCase() !== GENERAL_FOLDER.toLowerCase()) {
      return sendError(res, 'Unknown folder', 'VALIDATION_ERROR', 400);
    }

    if (isS3Enabled()) {
      const folders = mediaFolder ? [mediaFolder] : [...MEDIA_FOLDERS];
      for (const folder of folders) {
        if (await s3ObjectExists(`${folder}/${name}`)) {
          await removeUpload(folder, name);
          return sendSuccess(res, 'File deleted', { filename: name });
        }
      }
      return sendError(res, 'File not found', 'NOT_FOUND', 404);
    }

    const dirs = mediaFolder
      ? [path.join(UPLOAD_ROOT, mediaFolder)]
      : folderParam
        ? [UPLOAD_ROOT, LEGACY_MEDIA_DIR]
        : [...MEDIA_FOLDERS.map((f) => path.join(UPLOAD_ROOT, f)), UPLOAD_ROOT, LEGACY_MEDIA_DIR];
    const target = dirs.map((dir) => path.join(dir, name)).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!target) return sendError(res, 'File not found', 'NOT_FOUND', 404);
    const resolved = path.resolve(target);
    const root = path.resolve(UPLOAD_ROOT);
    const relTop = path.relative(root, resolved).split(path.sep)[0];
    if (!resolved.startsWith(root + path.sep) || PRIVATE_DIRS.includes(relTop)) {
      return sendError(res, 'This file cannot be deleted here.', 'FORBIDDEN', 403);
    }
    fs.unlinkSync(resolved);
    return sendSuccess(res, 'File deleted', { filename: name });
  } catch (err) {
    next(err);
  }
}
