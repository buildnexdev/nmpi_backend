import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'super_secret_community_32_byte_k!'; // 32 chars
const ALGORITHM = 'aes-256-cbc';

// Generate a deterministic SHA-256 hash for exact duplicate checks without revealing sensitive numbers
export function hashSensitiveData(value: string): string {
  if (!value) return '';
  const clean = value.replace(/\s+/g, '').toUpperCase().trim();
  return crypto.createHash('sha256').update(clean).digest('hex');
}

// AES-256 Encryption at rest
export function encryptData(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  // Ensure 32-byte key buffer
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text.trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// AES-256 Decryption
export function decryptData(text: string): string {
  if (!text || !text.includes(':')) return '';
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '';
  }
}
