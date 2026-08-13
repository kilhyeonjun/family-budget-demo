import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const upstream = '/Users/penguin/family-budget-web/';
const local = new URL('../packages/budget-ui/src/', import.meta.url).pathname;
const files = [
  'components/v4/app-shell.tsx', 'components/v4/category-ranking.tsx', 'components/v4/close-checklist.tsx',
  'components/v4/decision-badge.tsx', 'components/v4/entity-cards.tsx', 'components/v4/entity-grid.tsx',
  'components/v4/entity-table.tsx', 'components/v4/kpi-row.tsx', 'components/v4/nav-config.ts',
  'components/v4/purpose-summary.tsx', 'components/v4/quick-entry-form.tsx', 'components/v4/recent-list.tsx',
  'components/v4/recurring-reconciliation.tsx', 'components/v4/recurring-rule-manager.tsx', 'components/v4/recurring-tabs.tsx',
  'components/v4/settings-manager.tsx', 'components/v4/today-client.tsx', 'v4-theme.css',
  'lib/aggregate.ts', 'lib/dashboard-close.ts', 'lib/ledger-save-plan.ts', 'lib/local-date.ts', 'lib/monthly-decision.ts',
  'lib/v4/entity-config.ts', 'lib/v4/entity-save.ts', 'lib/v4/quick-entry.ts'
];
const sourcePath = f => f === 'v4-theme.css' ? `app/${f}` : f;
const sha = b => createHash('sha256').update(b).digest('hex');
for (const file of files) assert.equal(sha(await readFile(local + file)), sha(await readFile(upstream + sourcePath(file))), file);
assert.match(await readFile(local + 'contracts.ts', 'utf8'), /BudgetReadProvider/);
console.log(`${files.length} exact canonical files and contracts present`);
