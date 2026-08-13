import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const cssDir = join(root, '.next/static/chunks');
const cssFiles = (await readdir(cssDir)).filter(file => file.endsWith('.css'));
assert.ok(cssFiles.length, 'production build emitted no CSS');
const css = (await Promise.all(cssFiles.map(file => readFile(join(cssDir, file), 'utf8')))).join('\n');
for (const rule of ['.h-11{', '.sm\\:grid-cols-3{']) assert.ok(css.includes(rule), `missing canonical production utility ${rule}`);
console.log('production CSS includes canonical utility and responsive rules');
