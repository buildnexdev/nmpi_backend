"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_PUBLIC_FOLDERS = void 0;
exports.isS3Enabled = isS3Enabled;
exports.isS3PublicFolder = isS3PublicFolder;
exports.isS3Folder = isS3Folder;
exports.uploadToS3 = uploadToS3;
exports.deleteFromS3 = deleteFromS3;
exports.getS3Object = getS3Object;
exports.getS3ObjectBuffer = getS3ObjectBuffer;
exports.getS3MediaUrl = getS3MediaUrl;
exports.s3ObjectExists = s3ObjectExists;
exports.listS3Folder = listS3Folder;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const PUBLIC_FOLDERS = ['Gallery', 'Events', 'News', 'Leaders', 'Videos'];
const ALL_FOLDERS = [...PUBLIC_FOLDERS, 'profiles'];
let client = null;
function env(name) {
    return String(process.env[name] || '').trim();
}
function isS3Enabled() {
    return Boolean(env('AWS_S3_BUCKET'));
}
function isS3PublicFolder(folder) {
    return PUBLIC_FOLDERS.includes(folder);
}
function isS3Folder(folder) {
    return ALL_FOLDERS.includes(folder);
}
function requireBucket() {
    const bucket = env('AWS_S3_BUCKET');
    if (!bucket)
        throw new Error('AWS_S3_BUCKET is not set');
    return bucket;
}
function getClient() {
    if (client)
        return client;
    const region = env('AWS_REGION') || env('AWS_S3_REGION') || 'ap-south-1';
    const accessKeyId = env('AWS_ACCESS_KEY_ID');
    const secretAccessKey = env('AWS_SECRET_ACCESS_KEY');
    client = new client_s3_1.S3Client({
        region,
        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    return client;
}
async function uploadToS3(key, body, contentType) {
    await getClient().send(new client_s3_1.PutObjectCommand({
        Bucket: requireBucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
    }));
}
async function deleteFromS3(key) {
    await getClient().send(new client_s3_1.DeleteObjectCommand({
        Bucket: requireBucket(),
        Key: key,
    }));
}
async function getS3Object(key) {
    const obj = await getClient().send(new client_s3_1.GetObjectCommand({
        Bucket: requireBucket(),
        Key: key,
    }));
    if (!obj.Body)
        throw new Error(`S3 object has no body: ${key}`);
    const body = obj.Body;
    return {
        body,
        contentType: obj.ContentType || 'application/octet-stream',
        contentLength: obj.ContentLength,
    };
}
async function getS3ObjectBuffer(key) {
    try {
        const obj = await getClient().send(new client_s3_1.GetObjectCommand({
            Bucket: requireBucket(),
            Key: key,
        }));
        if (!obj.Body)
            return null;
        const bytes = await obj.Body.transformToByteArray();
        return Buffer.from(bytes);
    }
    catch {
        return null;
    }
}
async function getS3MediaUrl(key, expiresIn = 3600) {
    return (0, s3_request_presigner_1.getSignedUrl)(getClient(), new client_s3_1.GetObjectCommand({ Bucket: requireBucket(), Key: key }), { expiresIn });
}
async function s3ObjectExists(key) {
    try {
        await getClient().send(new client_s3_1.HeadObjectCommand({
            Bucket: requireBucket(),
            Key: key,
        }));
        return true;
    }
    catch {
        return false;
    }
}
async function listS3Folder(folder) {
    const prefix = `${folder}/`;
    const out = [];
    let token;
    do {
        const page = await getClient().send(new client_s3_1.ListObjectsV2Command({
            Bucket: requireBucket(),
            Prefix: prefix,
            ContinuationToken: token,
        }));
        for (const item of page.Contents || []) {
            const filename = (item.Key || '').slice(prefix.length);
            if (!filename || filename.includes('/'))
                continue;
            out.push({
                filename,
                folder,
                path: `/uploads/${folder}/${filename}`,
                url: `/uploads/${folder}/${filename}`,
                size: item.Size || 0,
                updated_at: (item.LastModified || new Date()).toISOString(),
            });
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return out.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}
exports.S3_PUBLIC_FOLDERS = PUBLIC_FOLDERS;
