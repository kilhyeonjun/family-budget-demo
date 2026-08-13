import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const scanRoots = ['app', 'components', 'lib', 'packages'];
const skip = new Set(['.git', '.next', 'node_modules']);
const forbidden = [
  ['private database module', 'lib/' + 'db.ts'], ['database client', '@libsql/' + 'client'],
  ['PIN authentication', '/api/auth/' + 'pin'], ['organization identifier', 'organization_' + 'id'],
  ['profile identifier', 'profile_' + 'id'], ['private API fetch', 'fetch(' + "'/api/"], ['private API fetch', 'fetch(' + '`/api/']
];
const findings = [];
async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { if (skip.has(entry.name)) continue; const path = join(dir, entry.name); if (entry.isDirectory()) await walk(path); else { let text; try { text = await readFile(path, 'utf8'); } catch { continue; } for (const [label, needle] of forbidden) if (text.includes(needle)) findings.push(`${relative(root, path)}: ${label}`); } } }
for (const dir of scanRoots) await walk(join(root, dir));
assert.deepEqual(findings, [], findings.join('\n'));
console.log('public boundary scan passed');
