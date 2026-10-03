import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

dotenv.config();

const DOWNLOADS_DIR = 'C:\\Users\\HP\\Downloads';

const parliamentCodes: Record<string, string> = {
  'Arakonam': 'ARK',
  'Arani': 'ARN',
  'Chennai Central': 'CNC',
  'Chennai North': 'CNN',
  'Chennai South': 'CNS',
  'Chidambaram': 'CDM',
  'Coimbatore': 'CBE',
  'Cuddalore': 'CUD',
  'Dharmapuri': 'DMP',
  'Dindigul': 'DGL',
  'Erode': 'ERD',
  'Kallakurichi': 'KKI',
  'Kancheepuram': 'KCM',
  'Kanniyakumari': 'KKM',
  'Karur': 'KRR',
  'Krishnagiri': 'KGI',
  'Madurai': 'MDU',
  'Mayiladuthurai': 'MYD',
  'Nagapattinam': 'NGP',
  'Namakkal': 'NMK',
  'Nilgiris': 'NLG',
  'Perambalur': 'PBL',
  'Pollachi': 'PLC',
  'Ramanathapuram': 'RMD',
  'Salem': 'SLM',
  'Sivaganga': 'SVG',
  'Sriperumbudur': 'SPB',
  'Tenkasi': 'TKS',
  'Thanjavur': 'TNJ',
  'Theni': 'THN',
  'Thoothukkudi': 'TUT',
  'Tiruchirappalli': 'TR',
  'Tirunelveli': 'TNV',
  'Tiruppur': 'TPR',
  'Tiruvannamalai': 'TVM',
  'Vellore': 'VEL',
  'Viluppuram': 'VPM',
  'Virudhunagar': 'VDN',
  'Thiruvallur': 'TVL'
};

async function seedDatabase() {
  console.log('🚀 Starting Database Initialization & Master Data Import...');

  const host = process.env.DATABASE_HOST || '127.0.0.1';
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const user = process.env.DATABASE_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || 'root';
  const dbName = process.env.DATABASE_NAME || 'org_platform_db';

  // 1. Root Connection to ensure database exists
  const rootConn = await mysql.createConnection({ host, port, user, password });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();
  console.log(`✅ Database '${dbName}' verified/created.`);

  // 2. Connect to org_platform_db
  const db = await mysql.createConnection({ host, port, user, password, database: dbName });

  // 3. Drop & Recreate Master & Core Tables
  console.log('📋 Creating Schema Tables...');
  await db.query(`SET FOREIGN_KEY_CHECKS = 0;`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`states\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name_en\` VARCHAR(100) NOT NULL UNIQUE,
      \`name_ta\` VARCHAR(100) NOT NULL,
      \`code\` VARCHAR(20) NOT NULL UNIQUE,
      \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`parliament_constituencies\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`state_id\` INT NOT NULL DEFAULT 1,
      \`name_en\` VARCHAR(100) NOT NULL UNIQUE,
      \`name_ta\` VARCHAR(100) NOT NULL,
      \`code\` VARCHAR(20) NOT NULL,
      \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY (\`state_id\`) REFERENCES \`states\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`assembly_constituencies\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`parliament_constituency_id\` INT NULL,
      \`name_en\` VARCHAR(100) NOT NULL UNIQUE,
      \`name_ta\` VARCHAR(100) NOT NULL,
      \`code\` VARCHAR(20) NULL,
      \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY (\`parliament_constituency_id\`) REFERENCES \`parliament_constituencies\`(\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`districts\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`lgd_code\` INT NOT NULL UNIQUE,
      \`state_id\` INT NOT NULL DEFAULT 1,
      \`name_en\` VARCHAR(100) NOT NULL,
      \`name_ta\` VARCHAR(100) NOT NULL,
      \`code\` VARCHAR(20) NOT NULL,
      \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY (\`state_id\`) REFERENCES \`states\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`blocks\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`district_id\` INT NOT NULL,
      \`lgd_code\` INT NOT NULL UNIQUE,
      \`name_en\` VARCHAR(100) NOT NULL,
      \`name_ta\` VARCHAR(100) NOT NULL,
      \`code\` VARCHAR(20) NULL,
      \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY (\`district_id\`) REFERENCES \`districts\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`villages\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`district_id\` INT NOT NULL,
      \`block_id\` INT NOT NULL,
      \`lgd_code\` INT NOT NULL UNIQUE,
      \`name_en\` VARCHAR(100) NOT NULL,
      \`name_ta\` VARCHAR(100) NULL,
      \`code\` VARCHAR(20) NULL,
      \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY (\`district_id\`) REFERENCES \`districts\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`block_id\`) REFERENCES \`blocks\`(\`id\`) ON DELETE CASCADE,
      INDEX \`idx_villages_block\` (\`block_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`roles\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(50) NOT NULL UNIQUE,
      \`description\` VARCHAR(255) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`email\` VARCHAR(191) NOT NULL UNIQUE,
      \`country_code\` VARCHAR(10) NOT NULL DEFAULT '+91',
      \`phone_number\` VARCHAR(20) NOT NULL UNIQUE,
      \`password_hash\` VARCHAR(255) NOT NULL,
      \`status\` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`user_roles\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT NOT NULL,
      \`role_id\` INT NOT NULL,
      UNIQUE KEY \`uk_user_role\` (\`user_id\`, \`role_id\`),
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`members\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT NOT NULL UNIQUE,
      \`member_id\` VARCHAR(50) NOT NULL UNIQUE,
      \`full_name\` VARCHAR(100) NOT NULL,
      \`father_name\` VARCHAR(100) NOT NULL,
      \`date_of_birth\` DATE NOT NULL,
      \`gender\` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
      \`country_code\` VARCHAR(10) NOT NULL DEFAULT '+91',
      \`phone_number\` VARCHAR(20) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`profile_image\` VARCHAR(255) NULL,
      \`blood_group\` ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown') NOT NULL DEFAULT 'Unknown',
      \`aadhaar_number_encrypted\` VARCHAR(255) NOT NULL,
      \`voter_id_encrypted\` VARCHAR(255) NOT NULL,
      \`aadhaar_hash\` VARCHAR(64) NOT NULL UNIQUE,
      \`voter_id_hash\` VARCHAR(64) NOT NULL UNIQUE,
      \`state_id\` INT NOT NULL DEFAULT 1,
      \`parliament_constituency_id\` INT NOT NULL,
      \`assembly_constituency_id\` INT NULL,
      \`district_id\` INT NOT NULL,
      \`block_id\` INT NOT NULL,
      \`village_id\` INT NULL,
      \`address_line1\` VARCHAR(255) NULL,
      \`village_custom\` VARCHAR(100) NULL,
      \`role_id\` INT NOT NULL DEFAULT 1,
      \`status\` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'APPROVED',
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`state_id\`) REFERENCES \`states\`(\`id\`),
      FOREIGN KEY (\`parliament_constituency_id\`) REFERENCES \`parliament_constituencies\`(\`id\`),
      FOREIGN KEY (\`district_id\`) REFERENCES \`districts\`(\`id\`),
      FOREIGN KEY (\`block_id\`) REFERENCES \`blocks\`(\`id\`),
      FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`),
      INDEX \`idx_members_phone\` (\`country_code\`, \`phone_number\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`member_qr_codes\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`member_id\` INT NOT NULL UNIQUE,
      \`verification_token\` VARCHAR(100) NOT NULL UNIQUE,
      \`qr_image_path\` VARCHAR(255) NULL,
      \`issued_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`expires_at\` DATETIME NULL,
      FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log('✅ Base tables verified.');

  // 4. Seed State (Tamil Nadu)
  await db.query(`INSERT IGNORE INTO \`states\` (id, name_en, name_ta, code) VALUES (1, 'Tamil Nadu', 'தமிழ்நாடு', 'TN');`);

  // 5. Seed Roles
  const defaultRoles = [
    { id: 1, name: 'Member', description: 'Standard Organization Member' },
    { id: 2, name: 'Volunteer', description: 'Active Community Volunteer' },
    { id: 3, name: 'Unit Coordinator', description: 'Coordinator for Local Village/Ward Unit' },
    { id: 4, name: 'Taluk Coordinator', description: 'Coordinator for Taluk / Block Division' },
    { id: 5, name: 'District Coordinator', description: 'Coordinator for District Level Division' },
    { id: 6, name: 'Admin', description: 'Regional Administrative Staff' },
    { id: 7, name: 'Super Admin', description: 'Full System Super Administrator' }
  ];
  for (const r of defaultRoles) {
    await db.query(`INSERT INTO \`roles\` (id, name, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description);`, [r.id, r.name, r.description]);
  }
  console.log('✅ Default Roles seeded.');

  // 6. Import Parliament Constituencies
  const parlFile = path.join(DOWNLOADS_DIR, 'List of Parliament Constituency in State.xlsx');
  if (fs.existsSync(parlFile)) {
    const wb = XLSX.readFile(parlFile);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    let count = 0;
    for (const r of rows) {
      const nameEn = String(r['Parliament  Constituency Name'] || '').trim();
      let nameTa = String(r['__EMPTY'] || '').trim();
      if (!nameEn || nameEn === 'English') continue;
      if (nameEn === 'Arakonam') nameTa = 'அரக்கோணம்'; // clean font encoding

      const pCode = parliamentCodes[nameEn] || nameEn.substring(0, 3).toUpperCase();
      await db.query(
        `INSERT INTO \`parliament_constituencies\` (state_id, name_en, name_ta, code) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE name_ta=VALUES(name_ta), code=VALUES(code);`,
        [nameEn, nameTa, pCode]
      );
      count++;
    }
    console.log(`✅ Seeded ${count} Parliament Constituencies.`);
  }

  // 7. Import Assembly Constituencies
  const assFile = path.join(DOWNLOADS_DIR, 'Assembly Constituency Name.xlsx');
  if (fs.existsSync(assFile)) {
    const wb = XLSX.readFile(assFile);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    let count = 0;
    for (const r of rows) {
      const nameEn = String(r['Assembly Constituency Name'] || '').trim();
      const nameTa = String(r['__EMPTY'] || '').trim();
      if (!nameEn || nameEn === 'English') continue;

      await db.query(
        `INSERT INTO \`assembly_constituencies\` (name_en, name_ta) VALUES (?, ?) ON DUPLICATE KEY UPDATE name_ta=VALUES(name_ta);`,
        [nameEn, nameTa]
      );
      count++;
    }
    console.log(`✅ Seeded ${count} Assembly Constituencies.`);
  }

  // 8. Import Districts (ENG & TAMIL)
  const distEngFile = path.join(DOWNLOADS_DIR, 'district_eng.xls');
  const distTaFile = path.join(DOWNLOADS_DIR, 'district_tamil.xls');
  if (fs.existsSync(distEngFile)) {
    const wbEng = XLSX.readFile(distEngFile);
    const rowsEng: any[] = XLSX.utils.sheet_to_json(wbEng.Sheets[wbEng.SheetNames[0]]);
    
    let taMap: Record<number, string> = {};
    if (fs.existsSync(distTaFile)) {
      const wbTa = XLSX.readFile(distTaFile);
      const rowsTa: any[] = XLSX.utils.sheet_to_json(wbTa.Sheets[wbTa.SheetNames[0]]);
      rowsTa.forEach((r: any) => {
        const code = Number(r['LGDDistrict Code']);
        const nameTa = String(r['District Name'] || '').trim();
        if (code && nameTa) taMap[code] = nameTa;
      });
    }

    let count = 0;
    for (const r of rowsEng) {
      const lgdCode = Number(r['LGDDistrict Code']);
      const nameEn = String(r['District Name'] || '').trim();
      if (!lgdCode || !nameEn) continue;
      const nameTa = taMap[lgdCode] || nameEn;
      const codeStr = `DIST-${lgdCode}`;

      await db.query(
        `INSERT INTO \`districts\` (lgd_code, state_id, name_en, name_ta, code) VALUES (?, 1, ?, ?, ?) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_ta=VALUES(name_ta);`,
        [lgdCode, nameEn, nameTa, codeStr]
      );
      count++;
    }
    console.log(`✅ Seeded ${count} Districts.`);
  }

  // 9. Import Blocks / Taluks (ENG & TAMIL)
  const blockEngFile = path.join(DOWNLOADS_DIR, 'block_eng.xls');
  const blockTaFile = path.join(DOWNLOADS_DIR, 'block_tamil.xls');
  if (fs.existsSync(blockEngFile)) {
    const wbEng = XLSX.readFile(blockEngFile);
    const rowsEng: any[] = XLSX.utils.sheet_to_json(wbEng.Sheets[wbEng.SheetNames[0]]);
    
    let taMap: Record<number, string> = {};
    if (fs.existsSync(blockTaFile)) {
      const wbTa = XLSX.readFile(blockTaFile);
      const rowsTa: any[] = XLSX.utils.sheet_to_json(wbTa.Sheets[wbTa.SheetNames[0]]);
      rowsTa.forEach((r: any) => {
        const code = Number(r['LGD Block code']);
        const nameTa = String(r['Block Name'] || '').trim();
        if (code && nameTa) taMap[code] = nameTa;
      });
    }

    // Fetch District ID mapping from MySQL
    const [distRows]: any = await db.query(`SELECT id, lgd_code FROM \`districts\`;`);
    const distIdMap: Record<number, number> = {};
    distRows.forEach((d: any) => { distIdMap[d.lgd_code] = d.id; });

    let count = 0;
    for (const r of rowsEng) {
      const distLgd = Number(r['LGD District Code']);
      const blockLgd = Number(r['LGD Block code']);
      const nameEn = String(r['Block Name'] || '').trim();
      if (!blockLgd || !nameEn || !distIdMap[distLgd]) continue;
      const districtId = distIdMap[distLgd];
      const nameTa = taMap[blockLgd] || nameEn;

      await db.query(
        `INSERT INTO \`blocks\` (district_id, lgd_code, name_en, name_ta) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_ta=VALUES(name_ta);`,
        [districtId, blockLgd, nameEn, nameTa]
      );
      count++;
    }
    console.log(`✅ Seeded ${count} Blocks/Taluks.`);
  }

  // 10. Import Villages
  const villageEngFile = path.join(DOWNLOADS_DIR, 'village_eng.xls');
  if (fs.existsSync(villageEngFile)) {
    console.log('⏳ Importing Villages (this may take a few seconds)...');
    const wbEng = XLSX.readFile(villageEngFile);
    const rowsEng: any[] = XLSX.utils.sheet_to_json(wbEng.Sheets[wbEng.SheetNames[0]]);
    
    const [distRows]: any = await db.query(`SELECT id, lgd_code FROM \`districts\`;`);
    const distIdMap: Record<number, number> = {};
    distRows.forEach((d: any) => { distIdMap[d.lgd_code] = d.id; });

    const [blockRows]: any = await db.query(`SELECT id, lgd_code FROM \`blocks\`;`);
    const blockIdMap: Record<number, number> = {};
    blockRows.forEach((b: any) => { blockIdMap[b.lgd_code] = b.id; });

    let count = 0;
    // Batch insert for performance
    const batchSize = 500;
    let valuesBatch: any[] = [];

    for (const r of rowsEng) {
      const distLgd = Number(r['LGD District Code']);
      const blockLgd = Number(r['LGD Block code']);
      const villageLgd = Number(r['LGD Village Code']);
      const nameEn = String(r['Village Name'] || '').trim();

      if (!villageLgd || !nameEn || !distIdMap[distLgd] || !blockIdMap[blockLgd]) continue;

      valuesBatch.push([distIdMap[distLgd], blockIdMap[blockLgd], villageLgd, nameEn]);
      count++;

      if (valuesBatch.length >= batchSize) {
        await db.query(
          `INSERT INTO \`villages\` (district_id, block_id, lgd_code, name_en) VALUES ? ON DUPLICATE KEY UPDATE name_en=VALUES(name_en);`,
          [valuesBatch]
        );
        valuesBatch = [];
      }
    }

    if (valuesBatch.length > 0) {
      await db.query(
        `INSERT INTO \`villages\` (district_id, block_id, lgd_code, name_en) VALUES ? ON DUPLICATE KEY UPDATE name_en=VALUES(name_en);`,
        [valuesBatch]
      );
    }
    console.log(`✅ Seeded ${count} Villages.`);
  }

  await db.end();
  console.log('🎉 Database seeding completed successfully!');
}

seedDatabase().catch((err) => {
  console.error('❌ Database Seeding Failed:', err);
  process.exit(1);
});
