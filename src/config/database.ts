import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool: Pool | null = null;
let isRealDbConnected = false;

// Mock database store fallback for standalone execution if MySQL server is offline
export const mockDbStore = {
  users: [
    { id: 1, email: 'admin@orgplatform.org', mobile: '+10000000001', password_hash: '$2b$10$WqK9t7G4T1fD6E0jY9X2e.3lX2Z9a8b7c6d5e4f3g2h1i0j9k8l7m', status: 'ACTIVE', created_at: new Date() },
    { id: 2, email: 'districtadmin@orgplatform.org', mobile: '+10000000002', password_hash: '$2b$10$WqK9t7G4T1fD6E0jY9X2e.3lX2Z9a8b7c6d5e4f3g2h1i0j9k8l7m', status: 'ACTIVE', created_at: new Date() },
    { id: 3, email: 'member1@orgplatform.org', mobile: '+10000000003', password_hash: '$2b$10$WqK9t7G4T1fD6E0jY9X2e.3lX2Z9a8b7c6d5e4f3g2h1i0j9k8l7m', status: 'ACTIVE', created_at: new Date() },
    { id: 4, email: 'member2@orgplatform.org', mobile: '+10000000004', password_hash: '$2b$10$WqK9t7G4T1fD6E0jY9X2e.3lX2Z9a8b7c6d5e4f3g2h1i0j9k8l7m', status: 'ACTIVE', created_at: new Date() },
  ],
  user_roles: [
    { user_id: 1, role: 'SUPER_ADMIN' },
    { user_id: 2, role: 'DISTRICT_ADMIN' },
    { user_id: 3, role: 'MEMBER' },
    { user_id: 4, role: 'MEMBER' },
  ],
  members: [
    { id: 1, user_id: 1, member_id: 'ORG-2026-000001', full_name: 'Organization Administrator', father_name: 'Founder Father', date_of_birth: '1985-01-15', gender: 'MALE', email: 'admin@orgplatform.org', mobile: '+10000000001', profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', address_line1: '100 Executive Way', address_line2: null as string | null, village: 'Civic Center Village', taluk_id: 1, district_id: 1, state: 'State Province', pincode: '100001', membership_type_id: 2, unit_id: 1, joining_date: '2026-01-01', status: 'APPROVED', created_at: '2026-01-01' },
    { id: 2, user_id: 2, member_id: 'ORG-2026-000002', full_name: 'Regional Director', father_name: 'Senior Director', date_of_birth: '1988-06-20', gender: 'FEMALE', email: 'districtadmin@orgplatform.org', mobile: '+10000000002', profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400', address_line1: '25 Regional Plaza', village: 'Civic Center Village', taluk_id: 1, district_id: 1, state: 'State Province', pincode: '100001', membership_type_id: 2, unit_id: 1, joining_date: '2026-01-10', status: 'APPROVED', created_at: '2026-01-10' },
    { id: 3, user_id: 3, member_id: 'ORG-2026-000003', full_name: 'John Doe Member', father_name: 'Robert Doe', date_of_birth: '1995-03-12', gender: 'MALE', email: 'member1@orgplatform.org', mobile: '+10000000003', profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', address_line1: '42 Community Lane', village: 'Green Park Village', taluk_id: 1, district_id: 1, state: 'State Province', pincode: '100002', membership_type_id: 1, unit_id: 2, joining_date: '2026-02-14', status: 'APPROVED', created_at: '2026-02-14' },
    { id: 4, user_id: 4, member_id: 'ORG-2026-000004', full_name: 'Jane Smith Volunteer', father_name: 'William Smith', date_of_birth: '2000-09-05', gender: 'FEMALE', email: 'member2@orgplatform.org', mobile: '+10000000004', profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', address_line1: '88 Valley Road', village: 'East Ridge Village', taluk_id: 2, district_id: 1, state: 'State Province', pincode: '100003', membership_type_id: 3, unit_id: 3, joining_date: '2026-03-01', status: 'APPROVED', created_at: '2026-03-01' },
  ],
  member_qr_codes: [
    { id: 1, member_id: 1, verification_token: 'TOKEN-ORG-ADMIN-VERIFY-2026-01', qr_image_path: 'uploads/qr/qr_org_2026_000001.png', issued_at: '2026-01-01' },
    { id: 2, member_id: 2, verification_token: 'TOKEN-ORG-DIR-VERIFY-2026-02', qr_image_path: 'uploads/qr/qr_org_2026_000002.png', issued_at: '2026-01-10' },
    { id: 3, member_id: 3, verification_token: 'TOKEN-MEMBER-JD-VERIFY-2026-03', qr_image_path: 'uploads/qr/qr_org_2026_000003.png', issued_at: '2026-02-14' },
    { id: 4, member_id: 4, verification_token: 'TOKEN-VOLUNTEER-JS-VERIFY-2026-04', qr_image_path: 'uploads/qr/qr_org_2026_000004.png', issued_at: '2026-03-01' },
  ],
  districts: [
    { id: 1, code: 'DIST-01', name: 'Central Capital District', state: 'State Province' },
    { id: 2, code: 'DIST-02', name: 'Northern Heights District', state: 'State Province' },
    { id: 3, code: 'DIST-03', name: 'Southern Coastal District', state: 'State Province' },
  ],
  taluks: [
    { id: 1, district_id: 1, name: 'Metro Central Taluk' },
    { id: 2, district_id: 1, name: 'East Suburban Taluk' },
    { id: 3, district_id: 2, name: 'North Valley Taluk' },
    { id: 4, district_id: 3, name: 'Harbor Port Taluk' },
  ],
  units: [
    { id: 1, code: 'UNIT-101', name: 'Unit 01 - Civic Center', taluk_id: 1, district_id: 1 },
    { id: 2, code: 'UNIT-102', name: 'Unit 02 - Green Park Community', taluk_id: 1, district_id: 1 },
    { id: 3, code: 'UNIT-201', name: 'Unit 03 - East Ridge Division', taluk_id: 2, district_id: 1 },
    { id: 4, code: 'UNIT-301', name: 'Unit 04 - North Valley Chapter', taluk_id: 3, district_id: 2 },
  ],
  membership_types: [
    { id: 1, name: 'Regular Member', fee: 10.00, validity_years: 1, description: 'Standard annual community membership' },
    { id: 2, name: 'Life Member', fee: 100.00, validity_years: 10, description: 'Lifetime patron membership with full assembly rights' },
    { id: 3, name: 'Youth Volunteer', fee: 0.00, validity_years: 1, description: 'Free volunteer membership for youth organizers' },
  ],
  news: [
    {
      id: 1,
      category_id: 1,
      author_id: 1,
      title: 'Annual General Assembly Announced for 2026',
      slug: 'annual-general-assembly-2026',
      summary: 'The Central Executive Council announces the schedule for the 2026 General Assembly meeting.',
      content: '<p>We are pleased to invite all verified organization members to attend the Annual General Assembly scheduled for next month. The conference will review regional initiatives, fiscal transparency reports, and new community outreach programs.</p>',
      cover_image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      is_featured: 1,
      status: 'PUBLISHED',
      published_at: '2026-09-15 10:00:00',
      category_name: 'Announcements',
      author_name: 'Organization Administrator',
    },
    {
      id: 2,
      category_id: 2,
      author_id: 1,
      title: 'Successful Clean Energy & Environment Drive Completed',
      slug: 'clean-energy-environment-drive',
      summary: 'Volunteers across 4 districts participated in tree planting and recycling campaigns.',
      content: '<p>Over 1,200 volunteers across all local units joined forces over the weekend to conduct community environment drives. Together, our units planted 5,000 saplings and established new community recycling drop-offs.</p>',
      cover_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
      is_featured: 0,
      status: 'PUBLISHED',
      published_at: '2026-09-20 14:30:00',
      category_name: 'Community Events',
      author_name: 'Organization Administrator',
    },
    {
      id: 3,
      category_id: 3,
      author_id: 1,
      title: 'Message from Organization President on Digital Identification System',
      slug: 'digital-identification-system-launch',
      summary: 'Enhanced security and QR digital membership cards introduced for all active members.',
      content: '<p>As part of our commitment to transparent community administration, we are proud to roll out the official QR-based Digital Identity Card system. Every member can now view and download their verified digital card instantly.</p>',
      cover_image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
      is_featured: 1,
      status: 'PUBLISHED',
      published_at: '2026-09-25 09:00:00',
      category_name: 'Leadership Messages',
      author_name: 'Organization Administrator',
    },
  ],
  events: [
    {
      id: 1,
      organizer_id: 1,
      title: 'Community Governance & Leadership Summit',
      slug: 'community-governance-summit',
      description: 'Join regional representatives for interactive workshops on local unit empowerment, civic engagement, and leadership development.',
      location: 'Central Civic Auditorium',
      venue_address: '700 Grand Avenue, Central Capital',
      event_date: '2026-10-15',
      start_time: '09:00:00',
      end_time: '17:00:00',
      cover_image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
      status: 'UPCOMING',
      capacity: 300,
    },
    {
      id: 2,
      organizer_id: 1,
      title: 'Youth Volunteer Training & Empowerment Seminar',
      slug: 'youth-volunteer-training',
      description: 'Skills development session for youth members covering project management, digital communications, and field organization.',
      location: 'North Valley Community Hall',
      venue_address: '12 Heritage Road, North District',
      event_date: '2026-10-28',
      start_time: '10:00:00',
      end_time: '15:00:00',
      cover_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
      status: 'UPCOMING',
      capacity: 150,
    },
  ],
  leaders: [
    { id: 1, name: 'Dr. Aris Thorne', designation: 'President & Executive Chair', photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400', biography: 'Dedicated public advocate with over 20 years of experience leading non-profit civic initiatives and community development boards.', display_order: 1, status: 'ACTIVE' },
    { id: 2, name: 'Elena Rostova', designation: 'Vice President & Field Director', photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400', biography: 'Community strategist specializing in regional outreach, youth engagement, and institutional organization.', display_order: 2, status: 'ACTIVE' },
    { id: 3, name: 'Marcus Vance', designation: 'General Secretary', photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400', biography: 'Legal counselor and administrator ensuring compliance, transparency, and effective organizational governance.', display_order: 3, status: 'ACTIVE' },
  ],
  gallery_albums: [
    { id: 1, title: 'Annual Community Assembly 2025', slug: 'annual-assembly-2025', description: 'Highlights from last year\'s regional convention', cover_image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', status: 'ACTIVE' },
    { id: 2, title: 'Green Earth Plantation Drive', slug: 'green-earth-plantation', description: 'Tree planting initiatives across district units', cover_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', status: 'ACTIVE' },
  ],
  gallery_images: [
    { id: 1, album_id: 1, image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', title: 'Opening Remarks', is_featured: 1 },
    { id: 2, album_id: 1, image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800', title: 'Delegates Workshop', is_featured: 0 },
    { id: 3, album_id: 2, image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', title: 'Plantation Volunteers', is_featured: 1 },
  ],
  organization_pages: {
    about: { title: 'About Our Organization', content: '<h2>Empowering Communities Through Transparent Governance</h2><p>Our organization stands as a unified platform dedicated to fostering community development, social equity, civic engagement, and ethical leadership. Built upon principles of transparency, inclusivity, and service, we work across regional units to represent civic voices and build sustainable community infrastructure.</p>' },
    history: { title: 'Our Historical Journey', content: '<h2>Decades of Community Commitment</h2><p>Founded with a vision for grassroots empowerment, our organization has grown from a local assembly of dedicated community leaders into a structured, transparent network spanning multiple districts and units.</p>' },
    vision: { title: 'Our Shared Vision', content: '<p>To create an inclusive, transparent, and digitally empowered community network where every member has a voice and active role in shaping a better future.</p>' },
    mission: { title: 'Our Core Mission', content: '<ul><li>Facilitate transparent member identity and representation.</li><li>Organize impactful community social and environmental initiatives.</li><li>Bridge grassroots requirements with administrative decision-making.</li></ul>' },
  },
  audit_logs: [
    { id: 1, user_id: 1, action: 'ADMIN_LOGIN', entity: 'USER', entity_id: '1', details: 'Successful admin login from IP 127.0.0.1', created_at: new Date().toISOString() },
  ],
  notifications: [
    { id: 1, title: 'Welcome to the Digital Platform', message: 'Your member profile and QR verification ID are now active.', target_type: 'ALL', type: 'ANNOUNCEMENT', created_at: '2026-09-01' }
  ]
};

export async function getDbConnection() {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'org_platform_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    
    // Quick connection sanity check
    const conn = await pool.getConnection();
    conn.release();
    isRealDbConnected = true;
    console.log('✅ Connected to MySQL Database successfully.');
    return pool;
  } catch (err: any) {
    console.log('⚠️ Could not connect to local MySQL server:', err.message);
    console.log('💡 Running with built-in high-performance mock database store.');
    isRealDbConnected = false;
    return null;
  }
}

export function isUsingRealDb(): boolean {
  return isRealDbConnected;
}
