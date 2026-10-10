"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveUpload = serveUpload;
const s3Service_1 = require("../services/s3Service");
async function serveUpload(req, res, next) {
    if (!(0, s3Service_1.isS3Enabled)())
        return next();
    const folder = String(req.params.folder || '');
    const filename = String(req.params.filename || '');
    if (!(0, s3Service_1.isS3Folder)(folder) || !filename || filename.includes('..') || filename.includes('/')) {
        return next();
    }
    try {
        const obj = await (0, s3Service_1.getS3Object)(`${folder}/${filename}`);
        res.setHeader('Content-Type', obj.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        if (obj.contentLength)
            res.setHeader('Content-Length', String(obj.contentLength));
        if (typeof obj.body.pipe === 'function') {
            obj.body.on('error', next);
            obj.body.pipe(res);
            return;
        }
        const chunks = [];
        for await (const chunk of obj.body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        res.send(Buffer.concat(chunks));
    }
    catch {
        next();
    }
}
