import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
export const PROFILE_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'profiles');
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

for (const dir of [UPLOADS_ROOT, PROFILE_UPLOAD_DIR]) {
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

function diskStorage(dir: string, prefix: string) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${prefix}_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    },
  });
}

export const uploadProfileImage = multer({
  storage: diskStorage(PROFILE_UPLOAD_DIR, 'profile'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadMediaImage = multer({
  storage: diskStorage(UPLOADS_ROOT, 'media'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
