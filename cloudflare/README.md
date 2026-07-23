# BNI Traffic Light — Cloudflare V3

This directory contains a parallel Cloudflare implementation. It does **not** change the current Vercel + Supabase production site until the team completes acceptance testing and switches the official URL.

## Architecture

- Cloudflare Workers: same-origin `/api/bni` API
- D1: chapters, report batches, member scores, sessions and audit logs
- R2: original monthly Excel files
- Workers Static Assets: existing production frontend copied from repository root

The frontend API contract remains compatible:

- `login`
- `history`
- `publish`

LT users continue to use only the website. They do not need GitHub, Cloudflare or SQL knowledge.

## Security decisions

- Member and LT passwords are Cloudflare Worker secrets, never repository variables.
- Session tokens are random; only SHA-256 token hashes are stored in D1.
- The original Excel file is private in R2.
- Publishing requires an admin session.
- A report is rejected when seven official component scores do not equal the Excel total.
- Existing production data exports must remain in `cloudflare/tmp/`, which is gitignored.

## One-time bootstrap

Use a team-owned Cloudflare account.

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

Wrangler can provision draft D1 and R2 bindings on deployment when the binding does not yet have a resource ID/name. The generated binding details should then be treated as production configuration and recorded in the team handover.

## Export current production data

Run locally. The password is read from the shell and is not written into source code.

```bash
cd cloudflare
SOURCE_PASSWORD='current LT password' npm run export:current -- ./tmp/current-history.json
npm run make:import -- ./tmp/current-history.json ./tmp/import-d1.sql
npx wrangler d1 execute DB --remote --file=./tmp/import-d1.sql
```

Delete the private export and generated SQL after verification:

```bash
rm -f ./tmp/current-history.json ./tmp/import-d1.sql
```

Historical Excel files are not required for the website to operate. New uploads are stored in R2 immediately. Historical source files should be copied from Supabase Storage into R2 before Supabase is finally retired if the team wants a complete raw-file archive.

## Verification before cutover

1. Open `/health`; it must return `ok: true`.
2. Test member login and LT login.
3. Compare batch count and member row count against current production.
4. Compare every member's seven official scores, total and light for May and June.
5. Open cases with 1-2-1 below full score and verify it appears in the plan, alternatives or data-check section.
6. Upload a test month and confirm preview, publish, history and Replace.
7. Download one PNG and the yellow-or-below ZIP.
8. Confirm the Excel object exists in R2.
9. Keep Supabase read-only for at least seven days after cutover.

## Local development

```bash
cd cloudflare
npm install
npm run db:migrate:local
npm run dev
```

Create `cloudflare/.dev.vars` locally:

```text
MEMBER_PASSWORD=test-member-password
ADMIN_PASSWORD=test-admin-password
```

Never commit `.dev.vars`.

## Production ownership

The Cloudflare account, GitHub environment secrets, billing and recovery email should belong to the BNI/team account, with at least two team administrators. The original developer can be removed after the handover and stability period.
