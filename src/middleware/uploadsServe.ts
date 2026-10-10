import { Request, Response, NextFunction } from 'express';
import { getS3Object, isS3Enabled, isS3Folder } from '../services/s3Service';

export async function serveUpload(req: Request, res: Response, next: NextFunction) {
  if (!isS3Enabled()) return next();

  const folder = String(req.params.folder || '');
  const filename = String(req.params.filename || '');
  if (!isS3Folder(folder) || !filename || filename.includes('..') || filename.includes('/')) {
    return next();
  }

  try {
    const obj = await getS3Object(`${folder}/${filename}`);
    res.setHeader('Content-Type', obj.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (obj.contentLength) res.setHeader('Content-Length', String(obj.contentLength));
    if (typeof obj.body.pipe === 'function') {
      obj.body.on('error', next);
      obj.body.pipe(res);
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of obj.body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    res.send(Buffer.concat(chunks));
  } catch {
    next();
  }
}
