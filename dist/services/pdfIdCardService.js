"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMemberIdCardPdf = generateMemberIdCardPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const idCardFormat_1 = require("../utils/idCardFormat");
const idCardLayout_1 = require("../utils/idCardLayout");
const uploadStorage_1 = require("../utils/uploadStorage");
const CARD_W = 204;
const CARD_H = 306;
function asset(...parts) {
    return path_1.default.join(process.cwd(), 'assets', ...parts);
}
function box(key) {
    if (key === 'qr') {
        const q = idCardLayout_1.ID_CARD_LAYOUT.qr;
        const size = q.size * CARD_W;
        return { x: q.x * CARD_W, y: q.y * CARD_H, w: size, h: size };
    }
    const r = idCardLayout_1.ID_CARD_LAYOUT[key];
    return { x: r.x * CARD_W, y: r.y * CARD_H, w: r.w * CARD_W, h: r.h * CARD_H };
}
function resolvePhotoPath(profileImage) {
    if (!profileImage)
        return null;
    const rel = String(profileImage).replace(/^\/+/, '');
    const abs = path_1.default.join(process.cwd(), rel);
    const uploadsRoot = path_1.default.join(process.cwd(), 'uploads');
    if (!abs.startsWith(uploadsRoot) || !fs_1.default.existsSync(abs))
        return null;
    return abs;
}
async function resolvePhoto(profileImage) {
    if (!profileImage)
        return null;
    const parsed = (0, uploadStorage_1.parsePublicUploadPath)(profileImage);
    if (parsed) {
        const buffer = await (0, uploadStorage_1.readUploadBuffer)(parsed.folder, parsed.filename);
        if (buffer)
            return buffer;
    }
    return resolvePhotoPath(profileImage);
}
async function generateMemberIdCardPdf(memberData) {
    return new Promise(async (resolve, reject) => {
        try {
            const templatePath = asset('id-card-template.jpg');
            if (!fs_1.default.existsSync(templatePath)) {
                return reject(new Error('ID card template image is missing from backend/assets.'));
            }
            const doc = new pdfkit_1.default({ size: [CARD_W, CARD_H], margin: 0 });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.image(templatePath, 0, 0, { width: CARD_W, height: CARD_H });
            const tamilFont = asset('fonts', 'NotoSansTamil-Bold.ttf');
            const hasTamil = fs_1.default.existsSync(tamilFont);
            if (hasTamil)
                doc.registerFont('TamilBold', tamilFont);
            const valueFont = hasTamil ? 'TamilBold' : 'Helvetica-Bold';
            const photoBox = box('photo');
            const photo = await resolvePhoto(memberData.profile_image);
            if (photo) {
                try {
                    doc.save();
                    doc.roundedRect(photoBox.x, photoBox.y, photoBox.w, photoBox.h, 6).clip();
                    doc.image(photo, photoBox.x, photoBox.y, {
                        cover: [photoBox.w, photoBox.h],
                        align: 'center',
                        valign: 'center',
                    });
                    doc.restore();
                }
                catch {
                    /* leave template photo hole */
                }
            }
            const texts = [
                { key: 'name', value: String(memberData.full_name || '').trim() || '—', font: valueFont, size: 8 },
                { key: 'bloodGroup', value: (0, idCardFormat_1.formatIdCardBloodGroup)(memberData.blood_group), font: 'Helvetica-Bold', size: 7.2 },
                { key: 'memberId', value: String(memberData.member_id || '').trim(), font: 'Helvetica-Bold', size: 7.2 },
                { key: 'designation', value: (0, idCardFormat_1.formatIdCardDesignation)(memberData), font: valueFont, size: 6.6 },
                { key: 'expiry', value: (0, idCardFormat_1.formatIdCardExpiry)(memberData.created_at || memberData.updated_at), font: 'Helvetica-Bold', size: 7.2 },
            ];
            for (const t of texts) {
                const b = box(t.key);
                doc.fillColor('#111111').font(t.font).fontSize(t.size);
                doc.text(t.value, b.x, b.y, {
                    width: b.w,
                    height: b.h,
                    lineGap: 0,
                    ellipsis: true,
                    align: t.key === 'bloodGroup' ? 'right' : 'left',
                });
            }
            const qrBox = box('qr');
            const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${memberData.verification_token || 'TOKEN'}`;
            const qrDataUrl = await qrcode_1.default.toDataURL(verifyUrl, { margin: 0, width: 280 });
            const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
            doc.image(qrBuffer, qrBox.x, qrBox.y, { fit: [qrBox.w, qrBox.h] });
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
