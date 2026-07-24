import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const input = resolve(process.argv[2] || './tmp/current-history.json');
const output = resolve(process.argv[3] || './tmp/import-d1.sql');
const chapterId = process.env.CHAPTER_ID || 'bingo';
const chapterSlug = process.env.CHAPTER_SLUG || 'bingo';
const chapterName = process.env.CHAPTER_NAME || 'BNI BINGO';
const data = JSON.parse(await readFile(input, 'utf8'));

const q = value => value === null || value === undefined
  ? 'NULL'
  : `'${String(value).replaceAll("'", "''")}'`;
const n = value => Number.isFinite(Number(value)) ? String(Math.trunc(Number(value))) : '0';
const normalize = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const json = value => q(JSON.stringify(value ?? {}));
const now = new Date().toISOString();
// Wrangler D1 remote execution rejects explicit BEGIN/COMMIT statements.
// The generated statements are idempotent UPSERTs, so the import is safe to retry.
const lines = ['PRAGMA foreign_keys = ON;'];

lines.push(`INSERT INTO chapters (id, slug, name, green_threshold, green_rate_goal, created_at, updated_at)
VALUES (${q(chapterId)}, ${q(chapterSlug)}, ${q(chapterName)}, 70, 75, ${q(now)}, ${q(now)})
ON CONFLICT(id) DO UPDATE SET
slug=excluded.slug, name=excluded.name, green_threshold=excluded.green_threshold,
green_rate_goal=excluded.green_rate_goal, updated_at=excluded.updated_at;`);

const batches = (Array.isArray(data.batches) ? [...data.batches] : [])
  .sort((a, b) => String(a.period_end || '').localeCompare(String(b.period_end || '')));
const members = Array.isArray(data.members) ? data.members : [];
for (const b of batches) {
  const sourceStatus = String(b.status || 'published');
  const targetStatus = sourceStatus === 'archived' ? 'published' : ['draft', 'published', 'replaced'].includes(sourceStatus) ? sourceStatus : 'published';
  const migrationNote = [b.notes, sourceStatus !== targetStatus ? `Original Supabase status: ${sourceStatus}` : null, b.storage_path ? `Original Supabase storage path: ${b.storage_path}` : null]
    .filter(Boolean).join(' | ') || null;
  lines.push(`INSERT INTO report_batches
(id, chapter_id, period_start, period_end, source_filename, storage_path, status, member_count, uploaded_at, published_at, previous_batch_id, notes)
VALUES (${q(b.id)}, ${q(chapterId)}, ${q(b.period_start)}, ${q(b.period_end)}, ${q(b.source_filename || 'historical.xlsx')},
NULL, ${q(targetStatus)}, ${n(b.member_count)}, ${q(b.uploaded_at || b.published_at || now)},
${q(b.published_at || b.uploaded_at || now)}, ${q(b.previous_batch_id)}, ${q(migrationNote)})
ON CONFLICT(id) DO UPDATE SET
chapter_id=excluded.chapter_id, period_start=excluded.period_start, period_end=excluded.period_end,
source_filename=excluded.source_filename, status=excluded.status, member_count=excluded.member_count,
uploaded_at=excluded.uploaded_at, published_at=excluded.published_at,
previous_batch_id=excluded.previous_batch_id, notes=excluded.notes;`);
}

for (const m of members) {
  const id = m.id || crypto.randomUUID();
  lines.push(`INSERT INTO member_scores
(id, batch_id, member_name, normalized_name, total_score, light, weeks, training_score, absence_score, lateness_score,
one_to_one_score, referral_score, biz_give_score, visitor_score, previous_score, improvement_tips, recap_text, raw_metrics)
VALUES (${q(id)}, ${q(m.batch_id)}, ${q(m.member_name)}, ${q(normalize(m.member_name))}, ${n(m.total_score)}, ${q(m.light)}, ${n(m.weeks)},
${n(m.training_score)}, ${n(m.absence_score)}, ${n(m.lateness_score)}, ${n(m.one_to_one_score)}, ${n(m.referral_score)},
${n(m.biz_give_score)}, ${n(m.visitor_score)}, ${m.previous_score == null ? 'NULL' : n(m.previous_score)},
${json(m.improvement_tips || [])}, ${q(m.recap_text)}, ${json(m.raw_metrics || {})})
ON CONFLICT(batch_id, normalized_name) DO UPDATE SET
member_name=excluded.member_name,
total_score=excluded.total_score, light=excluded.light, weeks=excluded.weeks,
training_score=excluded.training_score, absence_score=excluded.absence_score,
lateness_score=excluded.lateness_score, one_to_one_score=excluded.one_to_one_score,
referral_score=excluded.referral_score, biz_give_score=excluded.biz_give_score,
visitor_score=excluded.visitor_score, previous_score=excluded.previous_score,
improvement_tips=excluded.improvement_tips, recap_text=excluded.recap_text, raw_metrics=excluded.raw_metrics;`);
}

lines.push(`INSERT INTO audit_logs (chapter_id, batch_id, action, actor_role, details, created_at)
VALUES (${q(chapterId)}, NULL, 'migration_import', 'admin', ${json({ batches: batches.length, members: members.length, source_exported_at: data.exported_at || null })}, ${q(now)});`);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${lines.join('\n\n')}\n`);
console.log(`Generated ${output}: ${batches.length} batches, ${members.length} member rows.`);
console.log('Historical batches are imported oldest-first so previous_batch_id foreign keys resolve safely.');
console.log('UPSERT is used instead of REPLACE, so retries do not delete referenced batches.');
console.log('Historical Supabase storage paths were retained in notes only; D1 storage_path stays null until an R2 object exists.');
console.log(`Import with: npx wrangler d1 execute DB --remote --file=${output}`);