import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const root = new URL('..', import.meta.url).pathname;
const manifest = JSON.parse(await readFile(root + 'ssot/exact-source-manifest.json', 'utf8'));
assert.equal(manifest.upstream_commit, '348d5832445f4ca560e23bfe3666dc3d8277bb97');
const sha = value => createHash('sha256').update(value).digest('hex');
for (const entry of manifest.files) {
  const actual = sha(await readFile(root + 'packages/budget-ui/src/' + entry.path));
  assert.equal(actual, entry.public_sha256, `${entry.path}: public hash drift`);
  if (entry.seam === null) assert.equal(entry.public_sha256, entry.upstream_sha256, `${entry.path}: exact file differs`);
  else assert.ok(Object.hasOwn(manifest.seams, entry.seam), `${entry.path}: unknown seam`);
}
console.log(`verified ${manifest.files.length} SSOT files at ${manifest.upstream_commit}`);
