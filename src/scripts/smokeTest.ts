/*
 * End-to-end API smoke test. Requires the API to be running and a Super Admin account.
 *   SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... npm run test:smoke
 * Creates a throw-away member and content, then removes everything it created.
 */
import dotenv from 'dotenv';
dotenv.config();

import { createPool } from '../config/database';

const API = process.env.SMOKE_API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || '';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: any) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`, detail !== undefined ? JSON.stringify(detail).slice(0, 300) : '');
  }
}

async function call(method: string, path: string, opts: { token?: string; body?: any; form?: FormData } = {}) {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: any;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API}${path}`, { method, headers, body });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.arrayBuffer();
  return { status: res.status, data: data as any, type };
}

const rand = (digits: number) => Array.from({ length: digits }, () => Math.floor(Math.random() * 10)).join('');

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD.');
    process.exit(1);
  }
  const db = createPool();
  const created = { userId: 0, newsId: 0, eventId: 0, leaderId: 0, upload: '' };

  try {
    console.log('\nPublic endpoints');
    const health = await fetch(API.replace(/\/api$/, '/health'));
    check('health is UP', health.status === 200);
    const parl = await call('GET', '/master-data/parliaments');
    check('parliaments list', parl.status === 200 && parl.data.data.length > 0);
    const dist = await call('GET', '/master-data/districts');
    check('districts list', dist.status === 200 && dist.data.data.length > 0);
    const blocks = await call('GET', `/master-data/blocks?districtId=${dist.data.data[0].id}`);
    check('blocks list', blocks.status === 200 && blocks.data.data.length > 0);
    const roles = await call('GET', '/master-data/roles');
    check('public roles exclude admin roles', roles.data.data.every((r: any) => !['Admin', 'Super Admin'].includes(r.name)), roles.data.data);
    check('leadership list', (await call('GET', '/leadership')).status === 200);
    check('about page', (await call('GET', '/pages/about')).status === 200);
    check('uploads list', (await call('GET', '/uploads/list')).status === 200);

    console.log('\nAccess control');
    check('members list requires auth', (await call('GET', '/members')).status === 401);
    check('member detail requires auth', (await call('GET', '/members/1')).status === 401);
    check('dashboard requires auth', (await call('GET', '/dashboard/statistics')).status === 401);
    check('news create requires auth', (await call('POST', '/news', { body: { title: 'x' } })).status === 401);
    check('wrong password rejected', (await call('POST', '/auth/login', { body: { login: ADMIN_EMAIL, password: 'wrong-password' } })).status === 401);

    console.log('\nAdmin session');
    const adminLogin = await call('POST', '/auth/login', { body: { login: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    check('admin login', adminLogin.status === 200 && adminLogin.data.data.user.roles.includes('SUPER_ADMIN'), adminLogin.data);
    const adminToken = adminLogin.data.data.token;
    check('auth/me', (await call('GET', '/auth/me', { token: adminToken })).data.data?.email === ADMIN_EMAIL);
    const stats = await call('GET', '/dashboard/statistics', { token: adminToken });
    check('dashboard stats', stats.status === 200 && typeof stats.data.data.total_members === 'number', stats.data);
    const list = await call('GET', '/members?page=1&pageSize=5', { token: adminToken });
    check('members list paginated', list.status === 200 && Array.isArray(list.data.data.items), list.data);
    check('all roles for admins', (await call('GET', '/master-data/roles/all', { token: adminToken })).data.data.length >= 7);

    console.log('\nMember registration');
    const parliamentId = parl.data.data[0].id;
    const districtId = dist.data.data[0].id;
    const blockId = blocks.data.data[0].id;
    const phone = `9${rand(9)}`;
    const email = `smoke_${Date.now()}@example.org`;
    const password = 'SmokeTest123';
    const form = new FormData();
    const fields: Record<string, string> = {
      full_name: 'Smoke Test Member',
      father_name: 'Smoke Father',
      date_of_birth: '1990-05-20',
      gender: 'MALE',
      country_code: '+91',
      phone_number: phone,
      email,
      password,
      blood_group: 'B+',
      aadhaar_number: rand(12),
      voter_id: `SMK${rand(7)}`,
      state_id: '1',
      parliament_constituency_id: String(parliamentId),
      district_id: String(districtId),
      block_id: String(blockId),
      role_id: '6',
    };
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );
    form.append('profile_image', new Blob([tinyPng], { type: 'image/png' }), 'smoke-photo.png');
    const reg = await call('POST', '/members/register', { form });
    check('registration succeeds', reg.status === 201 && reg.data.data.member_id, reg.data);
    check('member id uses nmpi + constituency code + padded id', /^nmpi[A-Za-z0-9]+\d{5}$/.test(reg.data.data.member_id || ''), reg.data.data.member_id);
    const member = reg.data.data;
    created.userId = member.user_id;
    check('self-registration cannot become Admin', member.role_name === 'Member', member.role_name);
    check('registration response hides verification token', member.verification_token === undefined);
    check('registration response masks aadhaar', /^X+\d{4}$/.test(member.aadhaar_masked || ''), member.aadhaar_masked);

    const dupForm = new FormData();
    Object.entries({ ...fields, email: `other_${email}` }).forEach(([k, v]) => dupForm.append(k, v));
    dupForm.append('profile_image', new Blob([tinyPng], { type: 'image/png' }), 'smoke-photo.png');
    const dup = await call('POST', '/members/register', { form: dupForm });
    check('duplicate phone rejected with field', dup.status === 409 && dup.data.error?.details?.field === 'phone_number', dup.data);

    const underage = new FormData();
    Object.entries({ ...fields, date_of_birth: '2015-01-01', phone_number: `8${rand(9)}`, email: `u_${email}` }).forEach(([k, v]) => underage.append(k, v));
    underage.append('profile_image', new Blob([tinyPng], { type: 'image/png' }), 'smoke-photo.png');
    check('under-18 rejected', (await call('POST', '/members/register', { form: underage })).status === 400);

    const tokenPdf = await call('GET', `/members/id-card/download?token=${encodeURIComponent(member.id_card_token)}`);
    check('ID card download via registration token', tokenPdf.status === 200 && tokenPdf.type.includes('pdf'));
    check('ID card download rejects bad token', (await call('GET', '/members/id-card/download?token=bad')).status === 401);

    console.log('\nMember session');
    const memberLogin = await call('POST', '/auth/login', { body: { login: phone, password } });
    check('member login by phone', memberLogin.status === 200 && memberLogin.data.data.user.roles.includes('MEMBER'), memberLogin.data);
    const memberToken = memberLogin.data.data.token;
    const me = await call('GET', '/members/me', { token: memberToken });
    check('member profile with QR', me.status === 200 && String(me.data.data.qr_data_url).startsWith('data:image/png'), me.data);
    check('member own ID card', (await call('GET', '/members/me/id-card', { token: memberToken })).type.includes('pdf'));
    check('member cannot list members', (await call('GET', '/members', { token: memberToken })).status === 403);
    check('member cannot open dashboard', (await call('GET', '/dashboard/statistics', { token: memberToken })).status === 403);

    const verify = await call('GET', `/verify/${me.data.data.verification_token}`);
    check('public QR verification', verify.status === 200 && verify.data.data.member_id === member.member_id, verify.data);
    check('QR verification exposes member contact details', verify.data.data.phone_number && verify.data.data.email);
    check('unknown QR token 404', (await call('GET', '/verify/TOKEN-NOPE')).status === 404);

    console.log('\nAdmin member management');
    const detail = await call('GET', `/members/${member.id}`, { token: adminToken });
    check('admin member detail', detail.status === 200 && detail.data.data.aadhaar_number_encrypted === undefined, detail.data);
    const suspend = await call('PATCH', `/members/${member.id}/status`, { token: adminToken, body: { status: 'SUSPENDED' } });
    check('suspend member', suspend.status === 200 && suspend.data.data.status === 'SUSPENDED', suspend.data);
    check('suspended member cannot log in', (await call('POST', '/auth/login', { body: { login: email, password } })).status === 403);
    check('re-approve member', (await call('PATCH', `/members/${member.id}/status`, { token: adminToken, body: { status: 'APPROVED' } })).data.data?.status === 'APPROVED');
    check('invalid status rejected', (await call('PATCH', `/members/${member.id}/status`, { token: adminToken, body: { status: 'NOPE' } })).status === 400);
    const roleUpd = await call('PATCH', `/members/${member.id}/role`, { token: adminToken, body: { role_id: 5 } });
    check('change member role', roleUpd.status === 200 && roleUpd.data.data.role_name === 'District Coordinator', roleUpd.data);
    const coordLogin = await call('POST', '/auth/login', { body: { login: email, password } });
    check('coordinator gets DISTRICT_ADMIN access', coordLogin.data.data?.user?.roles?.includes('DISTRICT_ADMIN'), coordLogin.data);
    const scoped = await call('GET', '/members', { token: coordLogin.data.data.token });
    check('coordinator list is district-scoped', scoped.status === 200 && scoped.data.data.items.every((m: any) => m.district_name === me.data.data.district_name), scoped.data);
    check('coordinator cannot create news', (await call('POST', '/news', { token: coordLogin.data.data.token, body: {} })).status === 403);
    const csv = await call('GET', '/members/export.csv', { token: adminToken });
    check('CSV export', csv.status === 200 && csv.type.includes('text/csv'));
    check('admin downloads member ID card', (await call('GET', `/members/${member.id}/id-card`, { token: adminToken })).type.includes('pdf'));

    console.log('\nNews CRUD');
    const news = await call('POST', '/news', { token: adminToken, body: { title: 'Smoke News', summary: 'Summary', content: '<p>Body</p>', status: 'DRAFT' } });
    check('create draft news', news.status === 201, news.data);
    created.newsId = news.data.data.id;
    check('draft hidden from public', (await call('GET', `/news/${created.newsId}`)).status === 404);
    check('draft visible to admin list', (await call('GET', '/news/admin/list', { token: adminToken })).data.data.some((n: any) => n.id === created.newsId));
    check('publish news', (await call('PUT', `/news/${created.newsId}`, { token: adminToken, body: { status: 'PUBLISHED', title_ta: 'சோதனை' } })).data.data?.status === 'PUBLISHED');
    const pubNews = await call('GET', `/news/${created.newsId}`);
    check('published visible publicly with Tamil title', pubNews.status === 200 && pubNews.data.data.title_ta === 'சோதனை', pubNews.data);
    check('news validation', (await call('POST', '/news', { token: adminToken, body: { title: '' } })).status === 400);

    console.log('\nEvents CRUD');
    const ev = await call('POST', '/events', { token: adminToken, body: { title: 'Smoke Event', description: 'Desc', location: 'Chennai', event_date: '2030-01-15', start_time: '10:00' } });
    check('create event', ev.status === 201 && ev.data.data.event_date === '2030-01-15', ev.data);
    created.eventId = ev.data.data.id;
    check('upcoming events include it', (await call('GET', '/events?upcoming=true')).data.data.some((e: any) => e.id === created.eventId));
    check('update event', (await call('PUT', `/events/${created.eventId}`, { token: adminToken, body: { status: 'COMPLETED' } })).data.data?.status === 'COMPLETED');
    check('event date validation', (await call('POST', '/events', { token: adminToken, body: { title: 'x', description: 'x', location: 'x', event_date: '15/01/2030', start_time: '10:00' } })).status === 400);

    console.log('\nLeaders & pages');
    const leader = await call('POST', '/leadership', { token: adminToken, body: { name: 'Smoke Leader', designation: 'Tester', status: 'INACTIVE' } });
    check('create leader', leader.status === 201, leader.data);
    created.leaderId = leader.data.data.id;
    check('inactive leader hidden publicly', !(await call('GET', '/leadership')).data.data.some((l: any) => l.id === created.leaderId));
    check('update leader', (await call('PUT', `/leadership/${created.leaderId}`, { token: adminToken, body: { phone: '9999999999' } })).data.data?.phone === '9999999999');
    const about = (await call('GET', '/pages/about')).data.data;
    check('save page', (await call('PUT', '/pages/about', { token: adminToken, body: about })).status === 200);
    check('page key validation', (await call('PUT', '/pages/Bad Key!', { token: adminToken, body: about })).status === 400);

    console.log('\nMedia uploads');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const up = new FormData();
    up.append('file', new Blob([png], { type: 'image/png' }), 'smoke.png');
    const upload = await call('POST', '/uploads?folder=News', { token: adminToken, form: up });
    check('upload image into News folder', upload.status === 201 && /^\/uploads\/News\/IMG-\d{8}-\d{6}\.png$/.test(upload.data.data?.path || ''), upload.data);
    created.upload = upload.data.data?.filename || '';
    const served = await fetch(`${API.replace(/\/api$/, '')}${upload.data.data?.path}`);
    check('uploaded image is served', served.status === 200 && (served.headers.get('content-type') || '').startsWith('image/'));
    const newsList = await call('GET', '/uploads/list?folder=News');
    check('list filtered by folder', newsList.data.data.every((m: any) => m.folder === 'News') && newsList.data.data.some((m: any) => m.filename === created.upload));
    const defUp = new FormData();
    defUp.append('file', new Blob([png], { type: 'image/png' }), 'smoke.png');
    const defUpload = await call('POST', '/uploads?folder=../../etc', { token: adminToken, form: defUp });
    check('unknown folder falls back to Gallery', defUpload.data.data?.folder === 'Gallery', defUpload.data);
    check('delete by folder', (await call('DELETE', `/uploads/${encodeURIComponent(defUpload.data.data?.filename || 'x.png')}?folder=Gallery`, { token: adminToken })).status === 200);
    const bad = new FormData();
    bad.append('file', new Blob(['hello'], { type: 'text/plain' }), 'evil.txt');
    check('reject non-image upload', (await call('POST', '/uploads', { token: adminToken, form: bad })).status === 400);
    check('path traversal blocked', [400, 404].includes((await call('DELETE', `/uploads/${encodeURIComponent('..\\.env')}`, { token: adminToken })).status));
    check('member photos not deletable', (await call('DELETE', '/uploads/Nandha-ARK-001.jpeg', { token: adminToken })).status === 404);
  } finally {
    console.log('\nCleanup');
    const adminLogin = await call('POST', '/auth/login', { body: { login: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    const t = adminLogin.data?.data?.token;
    if (created.newsId) await call('DELETE', `/news/${created.newsId}`, { token: t });
    if (created.eventId) await call('DELETE', `/events/${created.eventId}`, { token: t });
    if (created.leaderId) await call('DELETE', `/leadership/${created.leaderId}`, { token: t });
    if (created.upload) await call('DELETE', `/uploads/${encodeURIComponent(created.upload)}?folder=News`, { token: t });
    if (created.userId) {
      const [rows]: any = await db.query('SELECT profile_image FROM tblMembers WHERE user_id = ?', [created.userId]);
      await db.query('DELETE FROM tblMember_qr_codes WHERE member_id IN (SELECT id FROM tblMembers WHERE user_id = ?)', [created.userId]);
      await db.query('DELETE FROM tblMembers WHERE user_id = ?', [created.userId]);
      await db.query('DELETE FROM tblUser_roles WHERE user_id = ?', [created.userId]);
      await db.query('DELETE FROM tblUsers WHERE id = ?', [created.userId]);
      console.log(`  removed test user #${created.userId}${rows[0]?.profile_image ? ' (with photo)' : ''}`);
    }
    await db.end();
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
