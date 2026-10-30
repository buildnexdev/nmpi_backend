import { Pool, PoolConnection } from 'mysql2/promise';
import { ABOUT_PAGE_SEED } from './aboutPageContent';

const TABLES: string[] = [
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

  `CREATE TABLE IF NOT EXISTS \`tblFeed_posts\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`member_id\` INT NULL,
    \`body\` TEXT NOT NULL,
    \`image_url\` VARCHAR(500) NULL,
    \`district_id\` INT NULL,
    \`status\` ENUM('ACTIVE', 'HIDDEN', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_feed_status_created\` (\`status\`, \`created_at\`),
    INDEX \`idx_feed_district\` (\`district_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblFeed_likes\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`post_id\` INT NOT NULL,
    \`user_id\` INT NOT NULL,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY \`uq_feed_like\` (\`post_id\`, \`user_id\`),
    INDEX \`idx_feed_likes_post\` (\`post_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblReels\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`title\` VARCHAR(255) NOT NULL,
    \`caption\` TEXT NULL,
    \`video_url\` VARCHAR(500) NOT NULL,
    \`thumbnail_url\` VARCHAR(500) NULL,
    \`district_id\` INT NULL,
    \`view_count\` INT NOT NULL DEFAULT 0,
    \`status\` ENUM('ACTIVE', 'HIDDEN', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_reels_status_created\` (\`status\`, \`created_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblReel_likes\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`reel_id\` INT NOT NULL,
    \`user_id\` INT NOT NULL,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY \`uq_reel_like\` (\`reel_id\`, \`user_id\`),
    INDEX \`idx_reel_likes_reel\` (\`reel_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblEvent_rsvps\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`event_id\` INT NOT NULL,
    \`user_id\` INT NOT NULL,
    \`member_id\` INT NULL,
    \`status\` ENUM('GOING', 'INTERESTED', 'NOT_GOING') NOT NULL DEFAULT 'GOING',
    \`checked_in\` TINYINT(1) NOT NULL DEFAULT 0,
    \`checked_in_at\` DATETIME NULL,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY \`uq_event_rsvp\` (\`event_id\`, \`user_id\`),
    INDEX \`idx_event_rsvp_event\` (\`event_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblSurveys\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`title\` VARCHAR(255) NOT NULL,
    \`description\` TEXT NULL,
    \`status\` ENUM('DRAFT', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    \`district_id\` INT NULL,
    \`created_by\` INT NULL,
    \`starts_at\` DATETIME NULL,
    \`ends_at\` DATETIME NULL,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_surveys_status\` (\`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblSurvey_questions\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`survey_id\` INT NOT NULL,
    \`question_text\` VARCHAR(500) NOT NULL,
    \`question_type\` ENUM('SINGLE', 'MULTI', 'TEXT') NOT NULL DEFAULT 'SINGLE',
    \`display_order\` INT NOT NULL DEFAULT 0,
    \`is_required\` TINYINT(1) NOT NULL DEFAULT 1,
    INDEX \`idx_survey_questions_survey\` (\`survey_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblSurvey_options\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`question_id\` INT NOT NULL,
    \`option_text\` VARCHAR(255) NOT NULL,
    \`display_order\` INT NOT NULL DEFAULT 0,
    INDEX \`idx_survey_options_question\` (\`question_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`tblSurvey_answers\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`survey_id\` INT NOT NULL,
    \`question_id\` INT NOT NULL,
    \`user_id\` INT NOT NULL,
    \`option_id\` INT NULL,
    \`text_answer\` TEXT NULL,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`idx_survey_answers_user\` (\`survey_id\`, \`user_id\`),
    INDEX \`idx_survey_answers_question\` (\`question_id\`)
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
    key: ABOUT_PAGE_SEED.key,
    title: ABOUT_PAGE_SEED.title,
    title_ta: ABOUT_PAGE_SEED.title_ta,
    content: ABOUT_PAGE_SEED.content,
    content_ta: ABOUT_PAGE_SEED.content_ta,
  },
  {
    key: 'structure',
    title: 'Organisational Structure',
    title_ta: 'அமைப்பு கட்டமைப்பு',
    content: '<p>State Executive Council, District Committees, Taluk / Block Divisions and Village Units.</p>',
    content_ta: '<p>மாநில செயற்குழு, மாவட்ட குழுக்கள், ஒன்றிய / வட்ட பிரிவுகள் மற்றும் கிராம கிளைகள்.</p>',
  },
];

const LEGACY_TABLE_MAP: Record<string, string> = {
  users: 'tblUsers',
  members: 'tblMembers',
  roles: 'tblRoles',
  user_roles: 'tblUser_roles',
  states: 'tblStates',
  districts: 'tblDistricts',
  blocks: 'tblBlocks',
  villages: 'tblVillages',
  parliament_constituencies: 'tblParliament_constituencies',
  assembly_constituencies: 'tblAssembly_constituencies',
  news: 'tblNews',
  events: 'tblEvents',
  leaders: 'tblLeaders',
  organization_pages: 'tblOrganization_pages',
  member_qr_codes: 'tblMember_qr_codes',
};

export async function ensureSchema(pool: Pool): Promise<void> {
  // Dev-server restarts can overlap; a named lock keeps the one-time seed from running twice.
  const db = await pool.getConnection();
  try {
    await db.query("SELECT GET_LOCK('nmpi_ensure_schema', 30)");
    await createAndSeed(db);
    await retargetLegacyForeignKeys(db);
  } finally {
    await db.query("SELECT RELEASE_LOCK('nmpi_ensure_schema')").catch(() => {});
    db.release();
  }
}

/** Live dump renamed tables to tbl*, but some FKs still point at users/roles/members. */
async function retargetLegacyForeignKeys(db: PoolConnection): Promise<void> {
  const [rows]: any = await db.query(`
    SELECT
      k.TABLE_NAME AS table_name,
      k.CONSTRAINT_NAME AS constraint_name,
      k.COLUMN_NAME AS column_name,
      k.REFERENCED_TABLE_NAME AS ref_table,
      k.REFERENCED_COLUMN_NAME AS ref_column,
      rc.DELETE_RULE AS delete_rule,
      rc.UPDATE_RULE AS update_rule,
      k.ORDINAL_POSITION AS pos
    FROM information_schema.KEY_COLUMN_USAGE k
    INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
      ON rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
     AND rc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
     AND rc.TABLE_NAME = k.TABLE_NAME
    WHERE k.TABLE_SCHEMA = DATABASE()
      AND k.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION
  `);

  const [tableRows]: any = await db.query(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
  );
  const existingByLower = new Map<string, string>(
    tableRows.map((t: any) => [String(t.TABLE_NAME).toLowerCase(), String(t.TABLE_NAME)])
  );

  const grouped = new Map<string, any[]>();
  for (const row of rows) {
    const key = `${row.table_name}::${row.constraint_name}`;
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }

  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const cols of grouped.values()) {
      const first = cols[0];
      const mapped = LEGACY_TABLE_MAP[String(first.ref_table || '').toLowerCase()];
      if (!mapped) continue;
      const target = existingByLower.get(mapped.toLowerCase());
      if (!target || String(first.ref_table).toLowerCase() === target.toLowerCase()) continue;

      const table = first.table_name;
      const constraint = first.constraint_name;
      const colList = cols.map((c: any) => `\`${c.column_name}\``).join(', ');
      const refList = cols.map((c: any) => `\`${c.ref_column}\``).join(', ');
      const onDelete = first.delete_rule && !['RESTRICT', 'NO ACTION'].includes(first.delete_rule)
        ? ` ON DELETE ${first.delete_rule}`
        : '';
      const onUpdate = first.update_rule && !['RESTRICT', 'NO ACTION'].includes(first.update_rule)
        ? ` ON UPDATE ${first.update_rule}`
        : '';

      try {
        await db.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraint}\``);
        await db.query(
          `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${constraint}\` FOREIGN KEY (${colList}) REFERENCES \`${target}\` (${refList})${onDelete}${onUpdate}`
        );
        console.log(`Retargeted FK ${table}.${constraint} -> ${target}`);
      } catch (err: any) {
        console.warn(`Could not retarget FK ${table}.${constraint}:`, err?.message);
      }
    }
  } finally {
    await db.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
  }
}

async function ensureNewsColumns(db: PoolConnection): Promise<void> {
  const alters = [
    'ADD COLUMN `place` VARCHAR(255) NULL AFTER `cover_image`',
    'ADD COLUMN `place_ta` VARCHAR(255) NULL AFTER `place`',
    'ADD COLUMN `news_date` DATE NULL AFTER `place_ta`',
    'ADD COLUMN `news_time` TIME NULL AFTER `news_date`',
  ];
  for (const clause of alters) {
    try {
      await db.query(`ALTER TABLE tblNews ${clause}`);
    } catch (err: any) {
      if (err?.code !== 'ER_DUP_FIELDNAME') throw err;
    }
  }
}

async function ensureMemberColumns(db: PoolConnection): Promise<void> {
  const alters = [
    'ADD COLUMN `designation` VARCHAR(150) NULL AFTER `role_id`',
  ];
  for (const clause of alters) {
    try {
      await db.query(`ALTER TABLE tblMembers ${clause}`);
    } catch (err: any) {
      if (err?.code !== 'ER_DUP_FIELDNAME') throw err;
    }
  }
}

async function createAndSeed(db: PoolConnection): Promise<void> {
  for (const ddl of TABLES) {
    await db.query(ddl);
  }
  await ensureNewsColumns(db);
  await ensureMemberColumns(db);

  // Clean up any default dummy seeded leaders and do NOT re-insert default values
  const dummyLeaderNames = [
    'Mr. M. Sivakumar',
    'Mr. VKR.S. Thiyagarajan',
    'Mr. Thaiyur S. Kumaravel',
    'Mrs. J. Kamatchi',
    'Mr. D. Sarath Kumar',
    'Mr. M.S. Balaji (A) Manikandan',
  ];
  await db.query(
    `DELETE FROM tblLeaders WHERE name IN (${dummyLeaderNames.map(() => '?').join(', ')})`,
    dummyLeaderNames
  ).catch(() => {});

  await db.query("DELETE FROM tblOrganization_pages WHERE page_key = 'history'");

  for (const p of SEED_PAGES) {
    if (p.key === 'about') {
      await db.query(
        `INSERT INTO tblOrganization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), title_ta = VALUES(title_ta), content = VALUES(content), content_ta = VALUES(content_ta)`,
        [p.key, p.title, p.title_ta, p.content, p.content_ta]
      );
    } else {
      await db.query(
        `INSERT IGNORE INTO tblOrganization_pages (page_key, title, title_ta, content, content_ta) VALUES (?, ?, ?, ?, ?)`,
        [p.key, p.title, p.title_ta, p.content, p.content_ta]
      );
    }
  }

  await seedCommunityDefaults(db);
}

async function seedCommunityDefaults(db: PoolConnection): Promise<void> {
  const [surveyCount]: any = await db.query('SELECT COUNT(*) AS c FROM tblSurveys');
  if (Number(surveyCount[0]?.c) > 0) return;

  const [sRes]: any = await db.query(
    `INSERT INTO tblSurveys (title, description, status) VALUES (?, ?, 'OPEN')`,
    [
      'NMPI Member Pulse',
      'Help shape our next programmes — share what matters most in your area.',
    ]
  );
  const surveyId = sRes.insertId;

  const [q1]: any = await db.query(
    `INSERT INTO tblSurvey_questions (survey_id, question_text, question_type, display_order, is_required)
     VALUES (?, ?, 'SINGLE', 0, 1)`,
    [surveyId, 'Which focus should NMPI prioritise this month?']
  );
  const opts1 = ['Community welfare camps', 'Youth leadership training', 'Legal awareness drives', 'Membership growth'];
  for (let i = 0; i < opts1.length; i++) {
    await db.query(
      `INSERT INTO tblSurvey_options (question_id, option_text, display_order) VALUES (?, ?, ?)`,
      [q1.insertId, opts1[i], i]
    );
  }

  const [q2]: any = await db.query(
    `INSERT INTO tblSurvey_questions (survey_id, question_text, question_type, display_order, is_required)
     VALUES (?, ?, 'TEXT', 1, 0)`,
    [surveyId, 'Any suggestion for your district? (optional)']
  );
  void q2;

  const [reelCount]: any = await db.query('SELECT COUNT(*) AS c FROM tblReels');
  if (Number(reelCount[0]?.c) === 0) {
    await db.query(
      `INSERT INTO tblReels (user_id, title, caption, video_url, thumbnail_url, status)
       VALUES (1, ?, ?, ?, NULL, 'ACTIVE')`,
      [
        'Welcome to NMPI',
        'Short introduction to Netaji Makkal Pathukappu Iyakkam.',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      ]
    ).catch(() => {});
  }
}
