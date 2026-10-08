"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberVerificationUrl = memberVerificationUrl;
exports.generateMemberQrDataUrl = generateMemberQrDataUrl;
const qrcode_1 = __importDefault(require("qrcode"));
function memberVerificationUrl(verificationToken) {
    return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationToken}`;
}
async function generateMemberQrDataUrl(verificationToken) {
    return qrcode_1.default.toDataURL(memberVerificationUrl(verificationToken), {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: { dark: '#7A0016', light: '#FFFFFF' },
        width: 300,
    });
}
