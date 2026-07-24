interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  MEMBER_PASSWORD: string;
  ADMIN_PASSWORD: string;
  CHAPTER_ID: string;
  CHAPTER_SLUG: string;
  CHAPTER_NAME: string;
  SESSION_DAYS: string;
}

type Role = 'member' | 'admin';

type MemberInput = {
  member_name: string;
  total_score: number;
  light: 'green' | 'yellow' | 'red' | 'black';
  weeks?: number;
  training_score: number;
  absence_score: number;
  lateness_score: number;
  one_to_one_score: number;
  referral_score: number;
  biz_give_score: number;
  visitor_score: number;
  previous_score?: number | null;
  improvement_tips?: unknown[];
  recap_text?: string | null;
  raw_metrics?: Record<string, unknown>;
};

type ReportInput = {
  period_start: string;
  period_end: string;
  source_filename: string;
  members: MemberInput[];
};

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const scoreKeys: Array<keyof MemberInput> = [
  'training_score', 'absence_score', 'lateness_score', 'one_to_one_score',
  'referral_score', 'biz_give_score', 'visitor_score'
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(message: string, status = 400, code?: string): Response {
  return json({ error: message, ...(code ? { code } : {}) }, status);
}

function normalizeName(value: unknown): string {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
}

function cleanFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 180) || 'report.xlsx';
}

function officialLight(score: number): MemberInput['light'] {
  return score >= 70 ? 'green' : score >= 50 ? 'yellow' : score >= 30 ? 'red' : 'black';
}

function integer(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return hex(new Uint8Array(digest));
}

async function sameSecret(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

async function ensureChapter(env: Env): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO chapters (id, slug, name, green_threshold, green_rate_goal, created_at, updated_at)
    VALUES (?, ?, ?, 70, 75, ?, ?)
    ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, name=excluded.name, updated_at=excluded.updated_at
  `).bind(env.CHAPTER_ID, env.CHAPTER_SLUG, env.CHAPTER_NAME, now, now).run();
}

async function login(env: Env, body: Record<string, unknown>): Promise<Response> {
  const role = body.role === 'admin' ? 'admin' : body.role === 'member' ? 'member' : null;
  const password = String(body.password ?? '');
  if (!role || !password) return fail('請輸入正確登入資料。', 400, 'INVALID_LOGIN');
  const expected = role === 'admin' ? env.ADMIN_PASSWORD : env.MEMBER_PASSWORD;
  if (!expected || !(await sameSecret(password, expected))) return fail('密碼不正確。', 401, 'INVALID_PASSWORD');

  await ensureChapter(env);
  const token = newToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const days = Math.max(1, Math.min(90, Number(env.SESSION_DAYS) || 30));
  const expires = new Date(now.getTime() + days * 86400000).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM access_sessions WHERE expires_at <= ?').bind(now.toISOString()),
    env.DB.prepare(`INSERT INTO access_sessions
      (token_hash, chapter_id, role, expires_at, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(tokenHash, env.CHAPTER_ID, role, expires, now.toISOString(), now.toISOString())
  ]);
  return json({ token, role, expires_at: expires });
}

async function session(env: Env, request: Request): Promise<{ role: Role; chapter_id: string } | null> {
  const token = request.headers.get('x-bni-token') || '';
  if (!token) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT role, chapter_id, expires_at FROM access_sessions WHERE token_hash = ?
  `).bind(hash).first<{ role: Role; chapter_id: string; expires_at: string }>();
  if (!row || row.expires_at <= new Date().toISOString()) return null;
  await env.DB.prepare('UPDATE access_sessions SET last_used_at = ? WHERE token_hash = ?')
    .bind(new Date().toISOString(), hash).run();
  return { role: row.role, chapter_id: row.chapter_id };
}

function parseJson(value: unknown, fallback: unknown): unknown {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

async function history(env: Env, auth: { role: Role; chapter_id: string }): Promise<Response> {
  const batches = await env.DB.prepare(`
    SELECT id, chapter_id, period_start, period_end, source_filename, storage_path,
           status, member_count, uploaded_at, published_at, previous_batch_id, notes
    FROM report_batches
    WHERE chapter_id = ? AND status = 'published'
    ORDER BY period_end DESC
  `).bind(auth.chapter_id).all<Record<string, unknown>>();

  const members = await env.DB.prepare(`
    SELECT ms.id, ms.batch_id, ms.member_name, ms.total_score, ms.light, ms.weeks,
           ms.training_score, ms.absence_score, ms.lateness_score, ms.one_to_one_score,
           ms.referral_score, ms.biz_give_score, ms.visitor_score, ms.previous_score,
           ms.improvement_tips, ms.recap_text, ms.raw_metrics
    FROM member_scores ms
    JOIN report_batches rb ON rb.id = ms.batch_id
    WHERE rb.chapter_id = ? AND rb.status = 'published'
    ORDER BY rb.period_end DESC, ms.member_name COLLATE NOCASE
  `).bind(auth.chapter_id).all<Record<string, unknown>>();

  return json({
    batches: batches.results,
    members: members.results.map(row => ({
      ...row,
      improvement_tips: parseJson(row.improvement_tips, []),
      raw_metrics: parseJson(row.raw_metrics, {})
    }))
  });
}

function validIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateReport(input: unknown): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['Report格式不正確。'];
  const report = input as Partial<ReportInput>;
  const startOk = validIsoDate(report.period_start);
  const endOk = validIsoDate(report.period_end);
  if (!startOk || !endOk) {
    errors.push('月份日期格式不正確。');
  } else {
    const [year, month] = report.period_start.split('-').map(Number);
    const expectedStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const expectedEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    if (report.period_start !== expectedStart || report.period_end !== expectedEnd) {
      errors.push('發布期間必須是同一月份的第一日至最後一日。');
    }
  }
  if (typeof report.source_filename !== 'string' || !report.source_filename.trim()) {
    errors.push('缺少Excel檔案名稱。');
  }
  if (!Array.isArray(report.members) || report.members.length < 1) {
    errors.push('Excel沒有會員資料。');
    return errors;
  }
  if (report.members.length > 1000) errors.push('單次發布會員數不可超過1000。');
  const seen = new Set<string>();
  const limits: Record<string, number> = {
    training_score: 10, absence_score: 15, lateness_score: 10, one_to_one_score: 10,
    referral_score: 20, biz_give_score: 15, visitor_score: 20
  };

  for (const m of report.members) {
    if (!m || typeof m !== 'object') { errors.push('發現格式不正確的會員資料。'); continue; }
    const name = normalizeName(m.member_name);
    if (!name) { errors.push('發現空白會員姓名。'); continue; }
    if (seen.has(name)) errors.push(`重複會員姓名：${m.member_name}`);
    seen.add(name);
    const total = integer(m.total_score);
    const componentScores = scoreKeys.map(key => integer(m[key]));
    if (!Number.isInteger(total) || total < 0 || total > 100 || componentScores.some(Number.isNaN)) {
      errors.push(`${m.member_name}：正式分數格式不正確。`);
      continue;
    }
    scoreKeys.forEach((key, index) => {
      const score = componentScores[index];
      const max = limits[String(key)];
      if (score < 0 || score > max) errors.push(`${m.member_name}：${String(key)} 必須介乎0至${max}分。`);
    });
    const sum = componentScores.reduce((a, b) => a + b, 0);
    if (sum !== total) errors.push(`${m.member_name}：七項合計 ${sum}，Excel總分 ${total}。`);
    if (m.light && m.light !== officialLight(total)) errors.push(`${m.member_name}：燈號與總分不一致。`);
  }
  return errors;
}

async function publish(env: Env, auth: { role: Role; chapter_id: string }, body: Record<string, unknown>): Promise<Response> {
  if (auth.role !== 'admin') return fail('只有LT管理員可以發布資料。', 403, 'ADMIN_REQUIRED');
  const errors = validateReport(body.report);
  if (errors.length) return fail(errors.slice(0, 25).join('\n'), 422, 'VALIDATION_FAILED');
  const report = body.report as ReportInput;
  const replaceExisting = body.replace_existing === true;


  const existing = await env.DB.prepare(`
    SELECT id FROM report_batches WHERE chapter_id = ? AND period_end = ?
  `).bind(auth.chapter_id, report.period_end).first<{ id: string }>();
  if (existing && !replaceExisting) return fail('相同月份已存在，請選擇取代月份資料。', 409, 'PERIOD_EXISTS');

  const previousBatch = await env.DB.prepare(`
    SELECT id FROM report_batches
    WHERE chapter_id = ? AND period_end < ? AND status = 'published'
    ORDER BY period_end DESC LIMIT 1
  `).bind(auth.chapter_id, report.period_end).first<{ id: string }>();

  const previousRows = previousBatch
    ? await env.DB.prepare('SELECT normalized_name, total_score FROM member_scores WHERE batch_id = ?')
        .bind(previousBatch.id).all<{ normalized_name: string; total_score: number }>()
    : { results: [] as Array<{ normalized_name: string; total_score: number }> };
  const previousMap = new Map(previousRows.results.map(x => [x.normalized_name, x.total_score]));

  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();
  const filename = cleanFilename(report.source_filename);

  const statements: D1PreparedStatement[] = [];
  if (existing) statements.push(env.DB.prepare('DELETE FROM report_batches WHERE id = ?').bind(existing.id));
  statements.push(env.DB.prepare(`
    INSERT INTO report_batches
      (id, chapter_id, period_start, period_end, source_filename, storage_path, status,
       member_count, uploaded_at, published_at, previous_batch_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?)
  `).bind(batchId, auth.chapter_id, report.period_start, report.period_end, filename,
    null, report.members.length, now, now, previousBatch?.id ?? null,
    existing ? 'Replaced existing period during Cloudflare publish; original Excel not stored' : 'Original Excel not stored; structured scores only'));

  for (const m of report.members) {
    const normalized = normalizeName(m.member_name);
    statements.push(env.DB.prepare(`
      INSERT INTO member_scores
        (id, batch_id, member_name, normalized_name, total_score, light, weeks,
         training_score, absence_score, lateness_score, one_to_one_score, referral_score,
         biz_give_score, visitor_score, previous_score, improvement_tips, recap_text, raw_metrics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), batchId, m.member_name.trim(), normalized, integer(m.total_score),
      officialLight(integer(m.total_score)), integer(m.weeks ?? 0) || 0,
      integer(m.training_score), integer(m.absence_score), integer(m.lateness_score),
      integer(m.one_to_one_score), integer(m.referral_score), integer(m.biz_give_score),
      integer(m.visitor_score), previousMap.get(normalized) ?? null,
      JSON.stringify(m.improvement_tips ?? []), m.recap_text ?? null, JSON.stringify(m.raw_metrics ?? {})
    ));
  }

  statements.push(env.DB.prepare(`
    INSERT INTO audit_logs (chapter_id, batch_id, action, actor_role, details, created_at)
    VALUES (?, ?, ?, 'admin', ?, ?)
  `).bind(auth.chapter_id, batchId, existing ? 'replace_period' : 'publish_period', JSON.stringify({
    period_end: report.period_end, member_count: report.members.length, source_filename: filename
  }), now));

  try {
    await env.DB.batch(statements);
  } catch (error) {
    console.error('Cloudflare publish failed', error);
    return fail('發布失敗，資料未有寫入。請稍後再試。', 500, 'PUBLISH_FAILED');
  }

  return json({ batch_id: batchId, period_end: report.period_end, member_count: report.members.length, replaced: Boolean(existing), source_file_stored: false });
}

async function logout(env: Env, request: Request): Promise<Response> {
  const token = request.headers.get('x-bni-token') || '';
  if (token) await env.DB.prepare('DELETE FROM access_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true });
}

async function api(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'allow': 'POST, OPTIONS' } });
  if (request.method !== 'POST') return fail('只支援POST request。', 405, 'METHOD_NOT_ALLOWED');
  let body: Record<string, unknown>;
  try { body = await request.json<Record<string, unknown>>(); }
  catch { return fail('Request格式不正確。', 400, 'INVALID_JSON'); }
  const action = String(body.action ?? '');
  if (action === 'login') return login(env, body);
  const auth = await session(env, request);
  if (!auth) return fail('登入已失效，請重新登入。', 401, 'SESSION_EXPIRED');
  if (action === 'history') return history(env, auth);
  if (action === 'logout') return logout(env, request);
  if (action === 'publish') return publish(env, auth, body);
  return fail('不支援的操作。', 400, 'UNKNOWN_ACTION');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/health') {
        await env.DB.prepare('SELECT 1 AS ok').first();
        return json({ ok: true, service: 'bni-traffic-light-cloudflare', time: new Date().toISOString() });
      }
      if (url.pathname === '/api/bni') return api(request, env);
      if (url.pathname === '/') {
        const v2Url = new URL('/v2.html', url);
        return env.ASSETS.fetch(new Request(v2Url, request));
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('Unhandled Worker error', error);
      return fail('服務暫時未能處理請求，請稍後再試。', 500, 'UNHANDLED_ERROR');
    }
  }
};
