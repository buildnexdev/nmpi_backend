import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { formatIdCardBloodGroup, formatIdCardDesignation, formatIdCardExpiry } from '../utils/idCardFormat';
import { ID_CARD_LAYOUT } from '../utils/idCardLayout';
import { parsePublicUploadPath, readUploadBuffer } from '../utils/uploadStorage';

const CARD_W = 204;
const CARD_H = 306;

type FieldKey = 'photo' | 'name' | 'memberId' | 'bloodGroup' | 'designation' | 'expiry';

function asset(...parts: string[]) {
  return path.join(process.cwd(), 'assets', ...parts);
}

/** True if text contains Tamil Unicode characters (U+0B80–U+0BFF). */
function isTamil(s: string): boolean {
  return /[\u0B80-\u0BFF]/.test(s);
}

function box(key: FieldKey | 'qr') {
  if (key === 'qr') {
    const q = ID_CARD_LAYOUT.qr;
    const size = q.size * CARD_W;
    return { x: q.x * CARD_W, y: q.y * CARD_H, w: size, h: size };
  }
  const r = ID_CARD_LAYOUT[key];
  return { x: r.x * CARD_W, y: r.y * CARD_H, w: r.w * CARD_W, h: r.h * CARD_H };
}

function resolvePhotoPath(profileImage?: string | null): string | null {
  if (!profileImage) return null;
  const rel = String(profileImage).replace(/^\/+/, '');
  const abs = path.join(process.cwd(), rel);
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  if (!abs.startsWith(uploadsRoot) || !fs.existsSync(abs)) return null;
  return abs;
}

async function resolvePhoto(profileImage?: string | null): Promise<Buffer | string | null> {
  if (!profileImage) return null;
  const parsed = parsePublicUploadPath(profileImage);
  if (parsed) {
    const buffer = await readUploadBuffer(parsed.folder, parsed.filename);
    if (buffer) return buffer;
  }
  return resolvePhotoPath(profileImage);
}

export async function generateMemberIdCardPdf(memberData: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const templatePath = asset('id-card-template.jpg');
      if (!fs.existsSync(templatePath)) {
        return reject(new Error('ID card template image is missing from backend/assets.'));
      }

      const doc = new PDFDocument({ size: [CARD_W, CARD_H], margin: 0 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.image(templatePath, 0, 0, { width: CARD_W, height: CARD_H });

      const muktaFont = asset('fonts', 'MuktaMalar-Bold.ttf');
      const notoFont = asset('fonts', 'NotoSansTamil-Bold.ttf');
      const hasMukta = fs.existsSync(muktaFont);
      const hasNoto = fs.existsSync(notoFont);

      if (hasMukta) {
        doc.registerFont('CardFont', muktaFont);
      } else if (hasNoto) {
        doc.registerFont('CardFont', notoFont);
      }

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
        } catch {
          /* leave template photo hole */
        }
      }

      // Reset graphics state after photo clipping block
      doc.fillColor('#111111').strokeColor('#111111');

      const nameVal = String(memberData.full_name || '').trim() || '—';
      const desgVal = formatIdCardDesignation(memberData);

      // Choose appropriate font for a given string:
      // MuktaMalar supports both Latin & Tamil natively.
      // If only NotoSansTamil is available, fall back to Helvetica-Bold when string is purely non-Tamil.
      const pickFont = (val: string) => {
        if (hasMukta) return 'CardFont';
        if (hasNoto && isTamil(val)) return 'CardFont';
        return 'Helvetica-Bold';
      };

      const texts: { key: FieldKey; value: string; size: number }[] = [
        { key: 'name',        value: nameVal,                                      size: 8 },
        { key: 'bloodGroup',  value: formatIdCardBloodGroup(memberData.blood_group), size: 7.2 },
        { key: 'memberId',    value: String(memberData.member_id || '').trim(),    size: 7.2 },
        { key: 'designation', value: desgVal,                                      size: 6.6 },
        { key: 'expiry',      value: formatIdCardExpiry(memberData.created_at || memberData.updated_at), size: 7.2 },
      ];

      for (const t of texts) {
        const b = box(t.key);
        doc.fontSize(t.size).fillColor('#111111');

        if (t.value.includes('\n')) {
          // Render multi-line values line-by-line to prevent control characters from triggering .notdef glyphs
          const lines = t.value.split('\n').map((l) => l.trim()).filter(Boolean);
          const lineH = t.size + 2.2;
          lines.forEach((line, idx) => {
            doc.font(pickFont(line)).text(line, b.x, b.y + idx * lineH, {
              width: b.w,
              lineBreak: false,
              ellipsis: true,
              align: 'left',
            });
          });
        } else {
          doc.font(pickFont(t.value)).text(t.value, b.x, b.y, {
            width: b.w,
            height: b.h,
            lineGap: 0,
            ellipsis: true,
            lineBreak: false,
            align: t.key === 'bloodGroup' ? 'right' : 'left',
          });
        }
      }

      const qrBox = box('qr');
      // Cover the template's pre-printed black QR — expand by 3pt each side to fully hide border
      const qrPad = 3;
      doc.rect(qrBox.x - qrPad, qrBox.y - qrPad, qrBox.w + qrPad * 2, qrBox.h + qrPad * 2).fill('white');
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${memberData.verification_token || 'TOKEN'}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 280 });
      const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
      doc.image(qrBuffer, qrBox.x, qrBox.y, { fit: [qrBox.w, qrBox.h] });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
