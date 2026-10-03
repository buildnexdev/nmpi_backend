import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export async function generateMemberIdCardPdf(memberData: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a standard CR80 ID card size document (3.375 x 2.125 inches in points: 243 x 153 pt)
      // Standard printable page: 2 pages (Front and Back)
      const doc = new PDFDocument({
        size: [243, 153], // 243pt x 153pt
        margin: 0
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const redMaroon = '#DC2626';
      const darkBlack = '#0A0A0A';
      const goldAccent = '#D4AF37';

      // ==========================================
      // PAGE 1: FRONT SIDE OF ID CARD
      // ==========================================

      // Background Header Bar
      doc.rect(0, 0, 243, 38).fill(darkBlack);
      doc.rect(0, 38, 243, 2).fill(redMaroon);

      // Organization Logo (if exists)
      const logoPath = path.join(process.cwd(), 'uploads', 'logo.jpg');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 8, 4, { fit: [30, 30] });
      }

      // Organization Title Text
      doc.fillColor('#FFFFFF')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('NETAJI MAKKAL PATHUKAPPU', 44, 8, { width: 190 });

      doc.fillColor('#F87171')
         .fontSize(7)
         .font('Helvetica')
         .text('நேதாஜி மக்கள் பாதுகாப்பு இயக்கம்', 44, 20, { width: 190 });

      // Main Card Body Background
      doc.rect(0, 40, 243, 113).fill('#FAFAFA');

      // Member Photo Placeholder / Image
      let photoDrawn = false;
      if (memberData.profile_image) {
        const photoPath = path.isAbsolute(memberData.profile_image)
          ? memberData.profile_image
          : path.join(process.cwd(), memberData.profile_image.replace(/^\//, ''));

        if (fs.existsSync(photoPath)) {
          try {
            doc.image(photoPath, 10, 48, { fit: [54, 64] });
            doc.rect(10, 48, 54, 64).lineWidth(1.5).stroke(redMaroon);
            photoDrawn = true;
          } catch (e) {
            photoDrawn = false;
          }
        }
      }

      if (!photoDrawn) {
        doc.rect(10, 48, 54, 64).fillAndStroke('#E5E7EB', redMaroon);
        doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica-Bold').text('PHOTO', 20, 74);
      }

      // Member Details Grid
      doc.fillColor(darkBlack)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(memberData.full_name || 'Member Name', 72, 48, { width: 160, ellipsis: true });

      doc.fillColor('#DC2626')
         .fontSize(7.5)
         .font('Helvetica-Bold')
         .text(`ID: ${memberData.member_id || '001TR00000'}`, 72, 62);

      doc.fillColor('#374151').fontSize(7).font('Helvetica');
      doc.text(`Phone: ${memberData.country_code || '+91'} ${memberData.phone_number || ''}`, 72, 74);
      doc.text(`Parliament: ${memberData.parliament_name || memberData.parliament_code || 'Tamil Nadu'}`, 72, 85, { width: 160, ellipsis: true });
      doc.text(`District: ${memberData.district_name || 'N/A'}`, 72, 96, { width: 160, ellipsis: true });

      // Blood Group Badge
      doc.rect(72, 110, 48, 14).fill(redMaroon);
      doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold').text(`BLOOD: ${memberData.blood_group || 'O+'}`, 75, 113);

      // Role Badge
      doc.rect(125, 110, 108, 14).fill(darkBlack);
      doc.fillColor(goldAccent).fontSize(7).font('Helvetica-Bold').text(memberData.role_name || 'MEMBER', 130, 113, { width: 100, align: 'center' });

      // ==========================================
      // PAGE 2: BACK SIDE OF ID CARD
      // ==========================================
      doc.addPage({ size: [243, 153], margin: 0 });

      // Back Top Header Bar
      doc.rect(0, 0, 243, 24).fill(darkBlack);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('DIGITAL MEMBERSHIP VERIFICATION', 10, 8, { align: 'center', width: 223 });

      // Generate QR Code Buffer
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${memberData.verification_token || 'TOKEN'}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 150 });
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');

      // Draw QR Code on Left
      doc.image(qrBuffer, 12, 32, { fit: [75, 75] });

      // Right Text Info
      doc.fillColor(darkBlack).fontSize(7.5).font('Helvetica-Bold').text('SCAN TO VERIFY', 96, 32);
      doc.fillColor('#4B5563').fontSize(6.5).font('Helvetica');
      doc.text('Scan QR code with smartphone to verify official member identity status.', 96, 44, { width: 135 });

      doc.fillColor(redMaroon).fontSize(7).font('Helvetica-Bold').text('ORGANIZATION CONTACT', 96, 68);
      doc.fillColor('#374151').fontSize(6.5).font('Helvetica');
      doc.text('HQ: Central Secretariat, Tamil Nadu', 96, 78, { width: 135 });
      doc.text('Email: info@netajimppi.org', 96, 88);
      doc.text('Web: www.netajimppi.org', 96, 98);

      // Back Footer Bar
      doc.rect(0, 133, 243, 20).fill(redMaroon);
      doc.fillColor('#FFFFFF').fontSize(6.5).font('Helvetica-Bold').text('OFFICIAL VERIFIED DIGITAL MEMBERSHIP CARD', 0, 140, { align: 'center', width: 243 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
