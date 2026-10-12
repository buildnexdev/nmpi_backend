import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { canonicalS3Folder, getS3ObjectBuffer, isS3Enabled } from '../services/s3Service';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

export async function serveUpload(req: Request, res: Response, next: NextFunction) {
  if (!isS3Enabled()) return next();

  const folder = String(req.params.folder || '');
  const filename = String(req.params.filename || '');
  const canonical = canonicalS3Folder(folder);
  if (!canonical || !filename || filename.includes('..') || filename.includes('/')) {
    return next();
  }

  try {
    const key = `${canonical}/${filename}`;
    const buffer = await getS3ObjectBuffer(key);
    if (!buffer) {
      console.warn(`[serveUpload] Object not found in S3: ${key}`);
      return next();
    }
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', String(buffer.length));
    return res.end(buffer);
  } catch (err: any) {
    console.error(`[serveUpload] Error serving ${canonical}/${filename}:`, err?.name, err?.message);
    next();
  }
}
