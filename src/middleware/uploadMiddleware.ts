import multer from 'multer';
import path from 'path';
import fs from 'fs';

const fromEnv = (process.env.UPLOAD_DIR || '').trim();
export const UPLOADS_ROOT = fromEnv
  ? path.resolve(fromEnv)
  : path.resolve(__dirname, '../../uploads');
export const PROFILE_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'profiles');
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
export const VIDEO_MEDIA_FOLDER = 'Videos' as const;

/** Public media folders under uploads/ that staff can upload into from the admin app. */
export const MEDIA_FOLDERS = ['Gallery', 'Events', 'News', 'Leaders', VIDEO_MEDIA_FOLDER] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];
export const DEFAULT_MEDIA_FOLDER: MediaFolder = 'Gallery';

/** Case-insensitive match of a requested folder name; null when it isn't one of MEDIA_FOLDERS. */
export function resolveMediaFolder(value: unknown): MediaFolder | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return MEDIA_FOLDERS.find((f) => f.toLowerCase() === value.trim().toLowerCase()) ?? null;
}

for (const dir of [UPLOADS_ROOT, PROFILE_UPLOAD_DIR, ...MEDIA_FOLDERS.map((f) => path.join(UPLOADS_ROOT, f))]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext) && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const err: any = new Error('Invalid image file type. Only JPG, JPEG, PNG and WEBP are allowed.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  }
};

const videoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const okMime = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';
  if (ALLOWED_VIDEO_EXTENSIONS.includes(ext) && okMime) {
    cb(null, true);
  } else {
    const err: any = new Error('Invalid video file type. Only MP4, WEBM and MOV are allowed.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  }
};

const memory = multer.memoryStorage();

/** IMG- / VID- YYYYMMDD-NNNNNN.ext, matching existing upload naming. */
function safeExt(originalName?: string): string {
  const ext = path.extname(String(originalName || '')).toLowerCase();
  return ext && ext.length <= 8 ? ext : '.jpg';
}

export function nextMediaFileName(folder: string, originalName: string): string {
  const ext = safeExt(originalName);
  const prefix = folder === VIDEO_MEDIA_FOLDER ? 'VID' : 'IMG';
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${prefix}-${stamp}-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}${ext}`;
}

export function nextProfileFileName(originalName: string): string {
  return `profile_${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt(originalName)}`;
}

export const uploadProfileImage = multer({
  storage: memory,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** Accepts images for uploads/<folder>/ (Gallery, Events, News, Leaders). */
export const uploadMediaImage = multer({
  storage: memory,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** Accepts videos for uploads/Videos/. */
export const uploadMediaVideo = multer({
  storage: memory,
  fileFilter: videoFileFilter,
  limits: { fileSize: 80 * 1024 * 1024 },
});
