import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('./', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('demo ships a synthetic read/write budget slice', async () => {
  const [html, app, seed] = await Promise.all([read('index.html'), read('app.js'), read('demo/seed-data.json')]);
  assert.match(html, /Synthetic demo/);
  assert.match(html, /id="transaction-form"/);
  assert.match(html, /id="ledger"/);
  assert.match(app, /localStorage\.setItem\(storageKey/);
  assert.match(app, /structuredClone\(seed\)/);
  assert.doesNotMatch(`${html}${app}${seed}`, /Google Sheet|Supabase|PIN|Telegram|\/Users\//i);
  const data = JSON.parse(seed);
  assert.equal(data.households.length, 1);
  assert.ok(data.transactions.length >= 5);
});

test('static app contains no external runtime dependency', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
});
