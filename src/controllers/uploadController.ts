import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { sendSuccess, sendError } from '../utils/response';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const MEDIA_DIR = path.join(UPLOAD_ROOT, 'media');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function ensureMediaDir() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function publicUrl(rel: string) {
  return `/${rel.replace(/\\/g, '/')}`;
}

function fileInfo(abs: string, rel: string) {
  const stat = fs.statSync(abs);
  return {
    filename: path.basename(abs),
    path: publicUrl(rel),
    url: publicUrl(rel),
    size: stat.size,
    updated_at: stat.mtime.toISOString(),
  };
}

function collectImages(dir: string, prefix: string, skipDirs: string[]) {
  if (!fs.existsSync(dir)) return [];
  const out: ReturnType<typeof fileInfo>[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (skipDirs.includes(name)) continue;
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) continue;
    if (!IMAGE_EXT.has(path.extname(name).toLowerCase())) continue;
    out.push(fileInfo(abs, path.join(prefix, name)));
  }
  return out;
}

export async function listUploads(_req: Request, res: Response, next: NextFunction) {
  try {
    ensureMediaDir();
    const media = collectImages(MEDIA_DIR, 'uploads/media', []);
    const root = collectImages(UPLOAD_ROOT, 'uploads', ['media', 'profiles', 'qr']);
    const items = [...media, ...root].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    return sendSuccess(res, 'Uploads retrieved', items);
  } catch (err) {
    next(err);
  }
}

export async function createUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return sendError(res, 'Choose an image file to upload.', 'VALIDATION_ERROR', 400);
    const rel = `uploads/media/${file.filename}`;
    return sendSuccess(res, 'File uploaded', {
      filename: file.filename,
      path: `/${rel}`,
      url: `/${rel}`,
      size: file.size,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const name = path.basename(req.params.filename || '');
    if (!name || name === '.' || name === '..') {
      return sendError(res, 'Invalid filename', 'VALIDATION_ERROR', 400);
    }
    const candidates = [path.join(MEDIA_DIR, name), path.join(UPLOAD_ROOT, name)];
    const target = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!target) return sendError(res, 'File not found', 'NOT_FOUND', 404);
    const resolved = path.resolve(target);
    if (!resolved.startsWith(path.resolve(UPLOAD_ROOT))) {
      return sendError(res, 'Invalid filename', 'VALIDATION_ERROR', 400);
    }
    if (resolved.includes(`${path.sep}profiles${path.sep}`) || resolved.includes(`${path.sep}qr${path.sep}`)) {
      return sendError(res, 'This file cannot be deleted here.', 'FORBIDDEN', 403);
    }
    fs.unlinkSync(resolved);
    return sendSuccess(res, 'File deleted', { filename: name });
  } catch (err) {
    next(err);
  }
}
