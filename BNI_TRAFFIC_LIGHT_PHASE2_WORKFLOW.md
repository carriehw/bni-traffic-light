# BNI BINGO Traffic Light — Phase 2 Release Workflow

## Release contents

- `index.html`
- `vendor_xlsx.full.min.js`
- `vendor_jszip.min.js`
- `bingo-logo.jpg`

## Deployment checklist

1. Keep the existing Supabase project and Edge Function connection.
2. Keep member and LT passwords in Supabase. Do not hard-code passwords in the frontend.
3. Replace the frontend release files in the existing repository.
4. Push to the `main` branch.
5. Confirm the existing Vercel project deploys the latest `main` commit to production.

## Production verification

### Authentication

- Member role accepts the configured member password.
- LT role accepts the configured administrator password.
- Incorrect passwords return a visible error.
- Logout removes the local session and returns to the login screen.

### Member portal

- Latest published report loads.
- Member search filters the list.
- Member detail shows score, light, breakdown, history, tips, and recap.
- The individual member card is rendered correctly.
- `下載會員圖卡` downloads a valid PNG file.

### LT portal

- LT tab appears only for administrator sessions.
- Excel upload accepts XLSX/XLS files.
- Empty workbooks are rejected.
- Missing member-name and total-score columns are rejected.
- Duplicate member names are reported.
- Score subtotal and total discrepancies are reported.
- Unusual total scores are reported.
- Valid reports can be published.
- Duplicate reporting periods are rejected by the backend.
- Batch ZIP contains one PNG per member plus `manifest.csv`.
- Manifest CSV downloads separately with readable Traditional Chinese text.

## Supabase preservation

The frontend calls the existing Edge Function URL and does not include a service-role key. Password verification, sessions, report publication, audit logs, database access, and storage uploads remain within the existing Supabase backend.
