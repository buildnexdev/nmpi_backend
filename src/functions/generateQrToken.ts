import crypto from 'crypto';

/**
 * Generates a high-entropy, secure verification token for member QR codes.
 * Example: TOKEN-ORG-7f9a8b1c2d3e4f5a...
 */
export function generateQrToken(): string {
  const randomHex = crypto.randomBytes(16).toString('hex');
  return `TOKEN-ORG-${randomHex}`;
}
