import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = process.env.SOURCE_URL || 'https://bni-traffic-light-eta.vercel.app';
const role = process.env.SOURCE_ROLE || 'admin';
const password = process.env.SOURCE_PASSWORD;
const output = resolve(process.argv[2] || './tmp/current-history.json');

if (!password) {
  throw new Error('Set SOURCE_PASSWORD in the shell. Never commit the password or exported JSON.');
}

const login = await fetch(`${source.replace(/\/$/, '')}/api/bni`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'login', role, password })
});
if (!login.ok) throw new Error(`Source login failed: ${login.status} ${await login.text()}`);
const auth = await login.json();

const history = await fetch(`${source.replace(/\/$/, '')}/api/bni`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-bni-token': auth.token },
  body: JSON.stringify({ action: 'history' })
});
if (!history.ok) throw new Error(`History export failed: ${history.status} ${await history.text()}`);
const data = await history.json();

await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ exported_at: new Date().toISOString(), source, ...data }, null, 2));
console.log(`Exported ${data.batches?.length || 0} batches and ${data.members?.length || 0} member rows to ${output}`);
console.log('This file contains member data. Keep it private and delete it after D1 import verification.');
