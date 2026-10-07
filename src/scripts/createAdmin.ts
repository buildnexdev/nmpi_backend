import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { createPool } from '../config/database';
import { ROLE_IDS } from '../constants';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = (arg('email') || '').trim().toLowerCase();
  const phone = (arg('phone') || '').replace(/\D/g, '');
  const password = arg('password') || '';

  if (!email || !phone || password.length < 8) {
    console.error('Usage: npm run create-admin -- --email admin@example.org --phone 9876543210 --password "StrongPass123"');
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const db = createPool();
  const hash = await bcrypt.hash(password, 10);

  const [existing]: any = await db.query('SELECT id FROM tblUsers WHERE email = ? OR phone_number = ?', [email, phone]);
  let userId: number;
  if (existing.length > 0) {
    userId = existing[0].id;
    await db.query("UPDATE tblUsers SET password_hash = ?, status = 'ACTIVE' WHERE id = ?", [hash, userId]);
    console.log(`Existing user #${userId} found; password reset and promoted to Super Admin.`);
  } else {
    const [res]: any = await db.query(
      "INSERT INTO tblUsers (email, country_code, phone_number, password_hash, status) VALUES (?, '+91', ?, ?, 'ACTIVE')",
      [email, phone, hash]
    );
    userId = res.insertId;
    console.log(`Created user #${userId}.`);
  }

  await db.query('INSERT IGNORE INTO tblUser_roles (user_id, role_id) VALUES (?, ?)', [userId, ROLE_IDS.SUPER_ADMIN]);
  console.log(`Super Admin ready. Log in to the admin portal with: ${email}`);
  await db.end();
}

main().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
