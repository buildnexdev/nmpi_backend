"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSchema = ensureSchema;
const aboutPageContent_1 = require("./aboutPageContent");
const TABLES = [
    `CREATE TABLE IF NOT EXISTS \`tblNews\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`author_id\` INT NULL,
    \`category\` VARCHAR(100) NOT NULL DEFAULT 'Announcement',
    \`title\` VARCHAR(255) NOT NULL,
    \`title_ta\` VARCHAR(255) NULL,
    \`slug\` VARCHAR(255) NOT NULL UNIQUE,
    \`summary\` TEXT NOT NULL,
    \`summary_ta\` TEXT NULL,
    \`content\` LONGTEXT NOT NULL,
    \`content_ta\` LONGTEXT NULL,
    \`cover_image\` VARCHAR(500) NULL,
    \`place\` VARCHAR(255) NULL,
    \`place_ta\` VARCHAR(255) NULL,
    \`news_date\` DATE NULL,
    \`news_time\` TIME NULL,
    \`is_featured\` TINYINT(1) NOT NULL DEFAULT 0,
    \`status\` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    \`published_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_news_status\` (\`status\`, \`published_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS \`tblEvents\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`organizer_id\` INT NULL,
    \`title\` VARCHAR(255) NOT NULL,
    \`title_ta\` VARCHAR(255) NULL,
    \`slug\` VARCHAR(255) NOT NULL UNIQUE,
    \`description\` TEXT NOT NULL,
    \`description_ta\` TEXT NULL,
    \`location\` VARCHAR(255) NOT NULL,
    \`venue_address\` TEXT NULL,
    \`event_date\` DATE NOT NULL,
    \`start_time\` TIME NOT NULL,
    \`end_time\` TIME NULL,
    \`cover_image\` VARCHAR(500) NULL,
    \`status\` ENUM('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    \`capacity\` INT NOT NULL DEFAULT 500,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_events_date\` (\`event_date\`),
    INDEX \`idx_events_status\` (\`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS \`tblLeaders\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(150) NOT NULL,
    \`name_ta\` VARCHAR(150) NULL,
    \`designation\` VARCHAR(150) NOT NULL,
    \`designation_ta\` VARCHAR(150) NULL,
    \`district\` VARCHAR(150) NULL,
    \`district_ta\` VARCHAR(150) NULL,
    \`qualification\` VARCHAR(100) NULL,
    \`photo_url\` VARCHAR(500) NULL,
    \`phone\` VARCHAR(30) NULL,
    \`email\` VARCHAR(191) NULL,
    \`bio\` TEXT NULL,
    \`display_order\` INT NOT NULL DEFAULT 0,
    \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS \`tblOrganization_pages\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`page_key\` VARCHAR(50) NOT NULL UNIQUE,
    \`title\` VARCHAR(255) NOT NULL,
    \`title_ta\` VARCHAR(255) NULL,
    \`content\` LONGTEXT NOT NULL,
    \`content_ta\` LONGTEXT NULL,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];
const SEED_LEADERS = [
    ['Mr. M. Sivakumar', 'திரு. M. சிவகுமார்', 'Ariyalur', 'அரியலூர்', 'M. Sc.'],
    ['Mr. VKR.S. Thiyagarajan', 'திரு. VKR.S. தியாகராஜன்', 'Chengalpattu Central', 'செங்கல்பட்டு மத்திய', 'B.Tech'],
    ['Mr. Thaiyur S. Kumaravel', 'திரு. தையூர் S. குமரவேல்', 'Chengalpattu East', 'செங்கல்பட்டு கிழக்கு', 'B.A'],
    ['Mrs. J. Kamatchi', 'திருமதி. J. காமாட்சி', 'Chengalpattu North', 'செங்கல்பட்டு வடக்கு', null],
    ['Mr. D. Sarath Kumar', 'திரு. D. சரத் குமார்', 'Chengalpattu North West', 'செங்கல்பட்டு வடமேற்கு', 'MBA'],
    ['Mr. M.S. Balaji (A) Manikandan', 'திரு. M.S. பாலாஜி (எ) மணிகண்டன்', 'Chengalpattu South', 'செங்கல்பட்டு தெற்கு', 'B.E'],
];
const SEED_PAGES = [
    {
        key: aboutPageContent_1.ABOUT_PAGE_SEED.key,
        title: aboutPageContent_1.ABOUT_PAGE_SEED.title,
        title_ta: aboutPageContent_1.ABOUT_PAGE_SEED.title_ta,
        content: aboutPageContent_1.ABOUT_PAGE_SEED.content,
        content_ta: aboutPageContent_1.ABOUT_PAGE_SEED.content_ta,
    },
    {
        key: 'structure',
        title: 'Organisational Structure',
        title_ta: 'அமைப்பு கட்டமைப்பு',
        content: '<p>State Executive Council, District Committees, Taluk / Block Divisions and Village Units.</p>',
        content_ta: '<p>மாநில செயற்குழு, மாவட்ட குழுக்கள், ஒன்றிய / வட்ட பிரிவுகள் மற்றும் கிராம கிளைகள்.</p>',
    },
];
async function ensureSchema(pool) {
    // Dev-server restarts can overlap; a named lock keeps the one-time seed from running twice.
    const db = await pool.getConnection();
    try {
        await db.query("SELECT GET_LOCK('nmpi_ensure_schema', 30)");
        await createAndSeed(db);
    }
    finally {
        await db.query("SELECT RELEASE_LOCK('nmpi_ensure_schema')").catch(() => { });
        db.release();
    }
}
async function ensureNewsColumns(db) {
    const alters = [
        'ADD COLUMN `place` VARCHAR(255) NULL AFTER `cover_image`',
        'ADD COLUMN `place_ta` VARCHAR(255) NULL AFTER `place`',
        'ADD COLUMN `news_date` DATE NULL AFTER `place_ta`',
        'ADD COLUMN `news_time` TIME NULL AFTER `news_date`',
    ];
    for (const clause of alters) {
        try {
            await db.query(`ALTER TABLE tblNews ${clause}`);
        }
        catch (err) {
            if (err?.code !== 'ER_DUP_FIELDNAME')
                throw err;
        }
    }
}
async function createAndSeed(db) {
    for (const ddl of TABLES) {
        await db.query(ddl);
    }
    await ensureNewsColumns(db);
    const [[leaderCount]] = await db.query('SELECT COUNT(*) AS c FROM tblLeaders');
    if (Number(leaderCount.c) === 0) {
        let order = 1;
        for (const [name, nameTa, district, districtTa, qualification] of SEED_LEADERS) {
            await db.query(`INSERT INTO tblLeaders (name, name_ta, designation, designation_ta, district, district_ta, qualification, display_order)
         VALUES (?, ?, 'District Secretary', 'மாவட்டச் செயலாளர்', ?, ?, ?, ?)`, [name, nameTa, district, districtTa, qualification, order++]);
        }
    }
    await db.query("DELETE FROM tblOrganization_pages WHERE page_key = 'history'");
    for (const p of SEED_PAGES) {
        if (p.key === 'about') {
            await db.query(`INSERT INTO tblOrganization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), title_ta = VALUES(title_ta), content = VALUES(content), content_ta = VALUES(content_ta)`, [p.key, p.title, p.title_ta, p.content, p.content_ta]);
        }
        else {
            await db.query(`INSERT IGNORE INTO tblOrganization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)`, [p.key, p.title, p.title_ta, p.content, p.content_ta]);
        }
    }
}
