import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PUBLIC_FOLDERS = ['Gallery', 'Events', 'News', 'Leaders', 'Videos'] as const;
const ALL_FOLDERS = [...PUBLIC_FOLDERS, 'profiles'] as const;

let client: S3Client | null = null;

export function isS3Enabled(): boolean {
  return Boolean(process.env.AWS_S3_BUCKET);
}

export function isS3PublicFolder(folder: string): boolean {
  return (PUBLIC_FOLDERS as readonly string[]).includes(folder);
}

export function isS3Folder(folder: string): boolean {
  return (ALL_FOLDERS as readonly string[]).includes(folder);
}

function requireBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('AWS_S3_BUCKET is not set');
  return bucket;
}

function getClient(): S3Client {
  if (client) return client;
  const region = process.env.AWS_REGION || process.env.AWS_S3_REGION || 'ap-south-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  client = new S3Client({
    region,
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
  return client;
}

export async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<void> {
  await getClient().send(new PutObjectCommand({
    Bucket: requireBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function deleteFromS3(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({
    Bucket: requireBucket(),
    Key: key,
  }));
}

export async function getS3Object(key: string): Promise<{
  body: Readable;
  contentType: string;
  contentLength?: number;
}> {
  const obj = await getClient().send(new GetObjectCommand({
    Bucket: requireBucket(),
    Key: key,
  }));
  if (!obj.Body) throw new Error(`S3 object has no body: ${key}`);
  const body = obj.Body as Readable;
  return {
    body,
    contentType: obj.ContentType || 'application/octet-stream',
    contentLength: obj.ContentLength,
  };
}

export async function getS3ObjectBuffer(key: string): Promise<Buffer | null> {
  try {
    const obj = await getClient().send(new GetObjectCommand({
      Bucket: requireBucket(),
      Key: key,
    }));
    if (!obj.Body) return null;
    const bytes = await obj.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

export async function getS3MediaUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: requireBucket(), Key: key }),
    { expiresIn },
  );
}

export async function s3ObjectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({
      Bucket: requireBucket(),
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

export async function listS3Folder(folder: string): Promise<{
  filename: string;
  folder: string;
  path: string;
  url: string;
  size: number;
  updated_at: string;
}[]> {
  const prefix = `${folder}/`;
  const out: {
    filename: string;
    folder: string;
    path: string;
    url: string;
    size: number;
    updated_at: string;
  }[] = [];
  let token: string | undefined;
  do {
    const page = await getClient().send(new ListObjectsV2Command({
      Bucket: requireBucket(),
      Prefix: prefix,
      ContinuationToken: token,
    }));
    for (const item of page.Contents || []) {
      const filename = (item.Key || '').slice(prefix.length);
      if (!filename || filename.includes('/')) continue;
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

export const S3_PUBLIC_FOLDERS = PUBLIC_FOLDERS;
