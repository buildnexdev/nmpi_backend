import nodemailer, { type Transporter } from 'nodemailer';

const DEFAULT_OFFICIAL_EMAIL = 'nmpiofficial2026@gmail.com';

export function getOfficialEmail(): string {
  return String(process.env.OFFICIAL_EMAIL || DEFAULT_OFFICIAL_EMAIL).trim();
}

function createTransporter(): Transporter | null {
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    console.warn(
      '⚠️ SMTP credentials not set (SMTP_USER / SMTP_PASS). Skipping email dispatch to ' + getOfficialEmail()
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export interface NewMemberEmailPayload {
  member_id: string;
  full_name: string;
  father_name?: string | null;
  designation?: string | null;
  role_name?: string | null;
  country_code?: string | null;
  phone_number: string;
  email: string;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  district_name?: string | null;
  district_name_ta?: string | null;
  block_name?: string | null;
  block_name_ta?: string | null;
  parliament_name?: string | null;
  village_name?: string | null;
  village_custom?: string | null;
  address_line1?: string | null;
  created_at?: string | null;
  profile_image?: string | null;
}

export async function sendNewMemberEnrollmentEmail(member: NewMemberEmailPayload): Promise<void> {
  const recipient = getOfficialEmail();
  const transporter = createTransporter();

  if (!transporter) return;

  const padhavi = (member.designation || '').trim() || member.role_name || 'Member (உறுப்பினர்)';
  const district = [member.district_name, member.district_name_ta].filter(Boolean).join(' / ') || '—';
  const block = [member.block_name, member.block_name_ta].filter(Boolean).join(' / ') || '—';
  const village = member.village_name || member.village_custom || '—';
  const phone = `${member.country_code || '+91'} ${member.phone_number}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 24px; margin: 0; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #7a0c1e 0%, #4a0612 100%); color: #ffffff; padding: 24px 28px; text-align: center; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 28px; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { padding: 10px 14px; text-align: left; font-size: 14px; }
    th { width: 35%; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
    td { width: 65%; color: #0f172a; font-weight: 500; border-bottom: 1px solid #f1f5f9; }
    .footer { padding: 18px 28px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>நேதாஜி மக்கள் பாதுகாப்பு இயக்கம்</h1>
      <p>Netaji Makkal Pathukappu Iyakkam — Digital Platform</p>
    </div>
    <div class="body">
      <div style="text-align: center;">
        <span class="badge">புதிய உறுப்பினர் பதிவு / New Member Enrolled</span>
      </div>
      <table>
        <tr><th>Member ID</th><td><strong style="color: #7a0c1e; font-family: monospace; font-size: 15px;">${member.member_id}</strong></td></tr>
        <tr><th>Full Name (பெயர்)</th><td><strong>${member.full_name}</strong></td></tr>
        <tr><th>Father's Name (தந்தை பெயர்)</th><td>${member.father_name || '—'}</td></tr>
        <tr><th>பதவி / Designation (Padhavi)</th><td><strong style="color: #0369a1;">${padhavi}</strong></td></tr>
        <tr><th>Mobile Number</th><td><a href="tel:${phone}" style="color: #7a0c1e; text-decoration: none; font-weight: 600;">${phone}</a></td></tr>
        <tr><th>Email</th><td>${member.email || '—'}</td></tr>
        <tr><th>Date of Birth</th><td>${member.date_of_birth || '—'}</td></tr>
        <tr><th>Gender</th><td>${member.gender || '—'}</td></tr>
        <tr><th>Blood Group</th><td>${member.blood_group || '—'}</td></tr>
        <tr><th>District (மாவட்டம்)</th><td>${district}</td></tr>
        <tr><th>Taluk / Block (வட்டம்)</th><td>${block}</td></tr>
        <tr><th>Parliament Constituency</th><td>${member.parliament_name || '—'}</td></tr>
        <tr><th>Village / Ward</th><td>${village}</td></tr>
        <tr><th>Address</th><td>${member.address_line1 || '—'}</td></tr>
        <tr><th>Enrolled At</th><td>${member.created_at || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
      </table>
    </div>
    <div class="footer">
      Automated notification sent to official movement inbox: ${recipient}<br/>
      NMPI Platform &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>
  `;

  try {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || `NMPI Portal <${recipient}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: `[NMPI] New Member Enrolled: ${member.full_name} (${member.member_id}) - ${member.district_name || ''}`,
      html,
    });
    console.log(`✉️ Enrollment email sent successfully to ${recipient} for ${member.member_id}`);
  } catch (err: any) {
    console.error(`❌ Failed to send enrollment email to ${recipient}:`, err?.message || err);
  }
}
