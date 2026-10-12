import fs from 'fs';
import path from 'path';
import { UPLOADS_ROOT } from '../middleware/uploadMiddleware';
import { HttpError } from '../types';
import {
  deleteFromS3,
  getS3ObjectBuffer,
  isS3Enabled,
  uploadToS3,
} from '../services/s3Service';

export function publicUploadPath(folder: string, filename: string): string {
  return `/uploads/${folder}/${filename}`;
}

export function parsePublicUploadPath(stored: string): { folder: string; filename: string } | null {
  const rel = String(stored || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
  const match = rel.match(/^uploads\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { folder: match[1], filename: match[2] };
}

function writeLocal(folder: string, filename: string, buffer: Buffer): void {
  const dir = path.join(UPLOADS_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);
}

export async function storeUpload(
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (isS3Enabled()) {
    try {
      await uploadToS3(`${folder}/${filename}`, buffer, contentType || 'application/octet-stream');
      console.log(`[storeUpload] S3 upload successful for ${folder}/${filename}`);
    } catch (err: any) {
      console.error('[storeUpload] CRITICAL: S3 upload failed:', err?.name, err?.message);
      throw new HttpError(
        500,
        `Cloud storage upload failed (${err?.name || 'S3_ERROR'}: ${err?.message || 'Failed to upload'}). Photo cannot be stored permanently.`,
        'STORAGE_ERROR',
      );
    }
    // Also write local copy if disk permits (for fast local read/cache)
    try { writeLocal(folder, filename, buffer); } catch {}
    return publicUploadPath(folder, filename);
  }

  try {
    writeLocal(folder, filename, buffer);
  } catch (err: any) {
    throw new HttpError(503, `Could not save the photo (${err?.message || 'disk write failed'}).`, 'UPLOAD_ERROR');
  }
  return publicUploadPath(folder, filename);
}

export async function removeUpload(folder: string, filename: string): Promise<void> {
  if (isS3Enabled()) {
    await deleteFromS3(`${folder}/${filename}`);
    return;
  }
  const filePath = path.join(UPLOADS_ROOT, folder, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export async function removeStoredUpload(stored?: string | null): Promise<void> {
  const parsed = stored ? parsePublicUploadPath(stored) : null;
  if (!parsed) return;
  try {
    await removeUpload(parsed.folder, parsed.filename);
  } catch {
    /* already gone */
  }
}

export async function readUploadBuffer(folder: string, filename: string): Promise<Buffer | null> {
  if (isS3Enabled()) return getS3ObjectBuffer(`${folder}/${filename}`);
  const filePath = path.join(UPLOADS_ROOT, folder, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export function fileBuffer(file: Express.Multer.File): Buffer {
  if (file.buffer?.length) return file.buffer;
  if (file.path && fs.existsSync(file.path)) return fs.readFileSync(file.path);
  throw new HttpError(400, 'Profile photo is required.', 'VALIDATION_ERROR', { field: 'profile_image' });
}
