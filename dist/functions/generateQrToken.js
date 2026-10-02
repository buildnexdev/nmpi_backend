"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQrToken = generateQrToken;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a high-entropy, secure verification token for member QR codes.
 * Example: TOKEN-ORG-7f9a8b1c2d3e4f5a...
 */
function generateQrToken() {
    const randomHex = crypto_1.default.randomBytes(16).toString('hex');
    return `TOKEN-ORG-${randomHex}`;
}
