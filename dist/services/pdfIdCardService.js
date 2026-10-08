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
            const tamilRegular = asset('fonts', 'NotoSansTamil-Regular.ttf');
            const hasTamil = fs_1.default.existsSync(tamilFont);
            const hasTamilReg = fs_1.default.existsSync(tamilRegular);
            if (hasTamil)
                doc.registerFont('TamilBold', tamilFont);
            if (hasTamilReg)
                doc.registerFont('Tamil', tamilRegular);
            const photoBox = box('photo');
            doc.rect(photoBox.x, photoBox.y, photoBox.w, photoBox.h).fill('#FFFFFF');
            const photoPath = resolvePhotoPath(memberData.profile_image);
            if (photoPath) {
                try {
                    doc.save();
                    doc.rect(photoBox.x, photoBox.y, photoBox.w, photoBox.h).clip();
                    doc.image(photoPath, photoBox.x, photoBox.y, { cover: [photoBox.w, photoBox.h], align: 'center', valign: 'center' });
                    doc.restore();
                }
                catch {
                    doc.rect(photoBox.x, photoBox.y, photoBox.w, photoBox.h).fill('#ECECEC');
                }
            }
            else {
                doc.rect(photoBox.x, photoBox.y, photoBox.w, photoBox.h).fill('#ECECEC');
            }
            const texts = [
                { key: 'name', value: String(memberData.full_name || '').trim() || '—', font: hasTamil ? 'TamilBold' : 'Helvetica-Bold', size: 7.5 },
                { key: 'memberId', value: String(memberData.member_id || '').trim(), font: 'Helvetica-Bold', size: 7 },
                { key: 'phone', value: (0, idCardFormat_1.formatIdCardPhone)(memberData.country_code, memberData.phone_number), font: 'Helvetica-Bold', size: 6.4 },
                { key: 'bloodGroup', value: (0, idCardFormat_1.formatIdCardBloodGroup)(memberData.blood_group), font: 'Helvetica-Bold', size: 6.4 },
                { key: 'designation', value: (0, idCardFormat_1.formatIdCardDesignation)(memberData), font: hasTamilReg ? 'Tamil' : hasTamil ? 'TamilBold' : 'Helvetica', size: 6.4 },
                { key: 'expiry', value: (0, idCardFormat_1.formatIdCardExpiry)(memberData.created_at || memberData.updated_at), font: 'Helvetica-Bold', size: 6.6 },
            ];
            for (const t of texts) {
                const b = box(t.key);
                doc.rect(b.x, b.y, b.w, b.h).fill('#FFFFFF');
            }
            for (const t of texts) {
                const b = box(t.key);
                doc.fillColor('#111111').font(t.font).fontSize(t.size);
                doc.text(t.value, t.key === 'expiry' ? b.x : b.x + 1, b.y + 1, {
                    width: t.key === 'expiry' ? b.w : b.w - 2,
                    height: b.h,
                    lineGap: 0,
                    ellipsis: true,
                });
            }
            const qrBox = box('qr');
            doc.rect(qrBox.x - 1, qrBox.y - 1, qrBox.w + 2, qrBox.h + 2).fill('#FFFFFF');
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
