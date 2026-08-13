import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const routes = ['page.tsx', 'dashboard/page.tsx', 'ledger/page.tsx', 'purpose/page.tsx', 'assets/page.tsx', 'recurring/page.tsx', 'settings/page.tsx'];
for (const route of routes) await access(join(root, 'app', route));
await access(join(root, 'packages/budget-ui/src/components/v4/app-shell.tsx'));
await access(join(root, 'packages/budget-ui/src/v4-theme.css'));
await access(join(root, 'ssot/exact-source-manifest.json'));
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
assert.equal(typeof pkg.scripts['verify:ssot'], 'string');
assert.equal(typeof pkg.scripts['scan:public-boundary'], 'string');
console.log('public SSOT contract present');
