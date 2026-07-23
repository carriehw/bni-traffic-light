# BNI Traffic Light — Cloudflare V3

This directory contains a parallel Cloudflare D1-only implementation. It does **not** change the current Vercel + Supabase production site until acceptance testing passes and the official URL is deliberately switched.

## Architecture

- Cloudflare Workers: same-origin `/api/bni` API
- D1: chapters, report batches, member scores, sessions and audit logs
- Workers Static Assets: existing production frontend copied from repository root
- No R2: original Excel files are parsed in the browser and are not transmitted to or stored by Cloudflare

The frontend API contract remains compatible: `login`, `history`, and `publish`.

## Data handling

- Member and LT passwords are Cloudflare Worker secrets.
- Session tokens are random; only SHA-256 token hashes are stored in D1.
- Publishing requires an admin session.
- A report is rejected when seven official component scores do not equal the Excel total.
- Only structured report data is saved. LT must retain each original Excel file separately for audit and recovery.
- Private migration exports remain in `cloudflare/tmp/`, which is gitignored and deleted after every deployment attempt.

## One-time bootstrap

```bash
cd cloudflare
npm install
npx wrangler login
npm run sync:assets
npx wrangler deploy
npx wrangler d1 migrations apply DB --remote
printf '%s' 'MEMBER_PASSWORD_HERE' | npx wrangler secret put MEMBER_PASSWORD
printf '%s' 'LT_PASSWORD_HERE' | npx wrangler secret put ADMIN_PASSWORD
npx wrangler deploy
```

## Export and migrate current production data

```bash
cd cloudflare
SOURCE_PASSWORD='current LT password' npm run export:current -- ./tmp/current-history.json
npm run make:import -- ./tmp/current-history.json ./tmp/import-d1.sql
npx wrangler d1 execute DB --remote --file=./tmp/import-d1.sql
rm -f ./tmp/current-history.json ./tmp/import-d1.sql
```

## Verification before cutover

1. Open `/health`; it must return `ok: true`.
2. Test member and LT login.
3. Compare batch and member row counts against current production.
4. Compare every member's seven official scores, total and light for May and June.
5. Verify cases with 1-2-1 below full score appear in the correct plan, alternative or data-check section.
6. Upload a test month and confirm preview, publish, history and Replace.
7. Download one PNG and the yellow-or-below ZIP.
8. Confirm the original Excel remains in the LT-managed backup folder because Cloudflare does not store it.
9. Keep Supabase read-only for at least seven days after cutover.

## Local development

```bash
cd cloudflare
npm install
npm run db:migrate:local
npm run dev
```

Create `cloudflare/.dev.vars` locally with test-only `MEMBER_PASSWORD` and `ADMIN_PASSWORD`. Never commit that file.

## Production ownership

The Cloudflare account, GitHub environment secrets, billing and recovery email should belong to the BNI/team account, with at least two team administrators.
