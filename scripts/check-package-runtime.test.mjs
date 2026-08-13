import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(await readFile(join(root, 'packages/budget-ui/package.json'), 'utf8'));
for (const key of ['./contracts', './runtime', './components/v4/*', './lib/*', './theme.css']) assert.ok(pkg.exports[key], `missing package export ${key}`);
const consumers = ['components/DemoShell.tsx', 'components/BudgetRoute.tsx', 'app/layout.tsx'];
for (const file of consumers) {
  const source = await readFile(join(root, file), 'utf8');
  assert.doesNotMatch(source, /@\/packages\/budget-ui\/src/, `${file} bypasses package boundary`);
}
for (const file of ['entity-grid.tsx', 'quick-entry-form.tsx', 'settings-manager.tsx', 'recurring-reconciliation.tsx']) {
  const source = await readFile(join(root, 'packages/budget-ui/src/components/v4', file), 'utf8');
  assert.match(source, /useBudgetRuntime/, `${file} must consume the declared runtime seam`);
  assert.doesNotMatch(source, /synthetic-budget/, `${file} must not import a consumer adapter`);
}
console.log('package exports and runtime seam verified');
