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
const lines = ['PRAGMA foreign_keys = ON;', 'BEGIN TRANSACTION;'];

lines.push(`INSERT INTO chapters (id, slug, name, green_threshold, green_rate_goal, created_at, updated_at)
VALUES (${q(chapterId)}, ${q(chapterSlug)}, ${q(chapterName)}, 70, 75, ${q(now)}, ${q(now)})
ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, name=excluded.name, updated_at=excluded.updated_at;`);

const batches = Array.isArray(data.batches) ? data.batches : [];
const members = Array.isArray(data.members) ? data.members : [];
for (const b of batches) {
  const migrationNote = [b.notes, b.storage_path ? `Original Supabase storage path: ${b.storage_path}` : null]
    .filter(Boolean).join(' | ') || null;
  lines.push(`INSERT OR REPLACE INTO report_batches
(id, chapter_id, period_start, period_end, source_filename, storage_path, status, member_count, uploaded_at, published_at, previous_batch_id, notes)
VALUES (${q(b.id)}, ${q(chapterId)}, ${q(b.period_start)}, ${q(b.period_end)}, ${q(b.source_filename || 'historical.xlsx')},
NULL, ${q(b.status || 'published')}, ${n(b.member_count)}, ${q(b.uploaded_at || b.published_at || now)},
${q(b.published_at || b.uploaded_at || now)}, ${q(b.previous_batch_id)}, ${q(migrationNote)});`);
}

for (const m of members) {
  const id = m.id || crypto.randomUUID();
  lines.push(`INSERT OR REPLACE INTO member_scores
(id, batch_id, member_name, normalized_name, total_score, light, weeks, training_score, absence_score, lateness_score,
one_to_one_score, referral_score, biz_give_score, visitor_score, previous_score, improvement_tips, recap_text, raw_metrics)
VALUES (${q(id)}, ${q(m.batch_id)}, ${q(m.member_name)}, ${q(normalize(m.member_name))}, ${n(m.total_score)}, ${q(m.light)}, ${n(m.weeks)},
${n(m.training_score)}, ${n(m.absence_score)}, ${n(m.lateness_score)}, ${n(m.one_to_one_score)}, ${n(m.referral_score)},
${n(m.biz_give_score)}, ${n(m.visitor_score)}, ${m.previous_score == null ? 'NULL' : n(m.previous_score)},
${json(m.improvement_tips || [])}, ${q(m.recap_text)}, ${json(m.raw_metrics || {})});`);
}

lines.push(`INSERT INTO audit_logs (chapter_id, batch_id, action, actor_role, details, created_at)
VALUES (${q(chapterId)}, NULL, 'migration_import', 'admin', ${json({ batches: batches.length, members: members.length, source_exported_at: data.exported_at || null })}, ${q(now)});`);
lines.push('COMMIT;');

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${lines.join('\n\n')}\n`);
console.log(`Generated ${output}: ${batches.length} batches, ${members.length} member rows.`);
console.log('Historical Supabase storage paths were retained in notes only; D1 storage_path stays null until an R2 object exists.');
console.log(`Import with: npx wrangler d1 execute DB --remote --file=${output}`);