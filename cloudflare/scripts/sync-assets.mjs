import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cloudflareDir = resolve(here, '..');
const root = resolve(cloudflareDir, '..');
const output = join(cloudflareDir, 'public');
const allowed = new Set(['.html', '.js', '.css', '.jpg', '.jpeg', '.png', '.svg', '.webp', '.ico', '.json']);
const excluded = new Set(['vercel.json', 'package.json', 'package-lock.json']);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

let count = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isFile() || excluded.has(entry.name) || !allowed.has(extname(entry.name).toLowerCase())) continue;
  await cp(join(root, entry.name), join(output, entry.name));
  count++;
}

if (!count) throw new Error('No frontend assets were found at repository root.');
console.log(`Synced ${count} frontend assets into ${output}`);
