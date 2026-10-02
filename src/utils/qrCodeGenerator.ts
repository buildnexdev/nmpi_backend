import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export async function generateMemberQrDataUrl(verificationToken: string): Promise<string> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationToken}`;
  return await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#7A0016', // Deep Maroon branding
      light: '#FFFFFF',
    },
    width: 300,
  });
}

export async function saveMemberQrImage(verificationToken: string, memberIdStr: string): Promise<string> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationToken}`;
  const uploadDir = path.join(process.cwd(), 'uploads', 'qr');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `qr_${memberIdStr.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
  const filePath = path.join(uploadDir, filename);

  await QRCode.toFile(filePath, verificationUrl, {
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
