"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashSensitiveData = hashSensitiveData;
exports.encryptData = encryptData;
exports.decryptData = decryptData;
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'super_secret_community_32_byte_k!'; // 32 chars
const ALGORITHM = 'aes-256-cbc';
// Generate a deterministic SHA-256 hash for exact duplicate checks without revealing sensitive numbers
function hashSensitiveData(value) {
    if (!value)
        return '';
    const clean = value.replace(/\s+/g, '').toUpperCase().trim();
    return crypto_1.default.createHash('sha256').update(clean).digest('hex');
}
// AES-256 Encryption at rest
function encryptData(text) {
    if (!text)
        return '';
    const iv = crypto_1.default.randomBytes(16);
    // Ensure 32-byte key buffer
    const key = crypto_1.default.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text.trim(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}
// AES-256 Decryption
function decryptData(text) {
    if (!text || !text.includes(':'))
        return '';
    try {
        const [ivHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = crypto_1.default.createHash('sha256').update(ENCRYPTION_KEY).digest();
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        return '';
    }
}
