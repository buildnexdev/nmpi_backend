import QRCode from 'qrcode';

export function memberVerificationUrl(verificationToken: string): string {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationToken}`;
}

export async function generateMemberQrDataUrl(verificationToken: string): Promise<string> {
  return QRCode.toDataURL(memberVerificationUrl(verificationToken), {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#7A0016', light: '#FFFFFF' },
    width: 300,
  });
}
