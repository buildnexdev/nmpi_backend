"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMemberQrDataUrl = generateMemberQrDataUrl;
exports.saveMemberQrImage = saveMemberQrImage;
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function generateMemberQrDataUrl(verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationToken}`;
    return await qrcode_1.default.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
            dark: '#7A0016', // Deep Maroon branding
            light: '#FFFFFF',
        },
        width: 300,
    });
}
async function saveMemberQrImage(verificationToken, memberIdStr) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationToken}`;
    const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'qr');
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    const filename = `qr_${memberIdStr.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    const filePath = path_1.default.join(uploadDir, filename);
    await qrcode_1.default.toFile(filePath, verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
            dark: '#7A0016',
            light: '#FFFFFF',
        },
        width: 400,
    });
    return `uploads/qr/${filename}`;
}
