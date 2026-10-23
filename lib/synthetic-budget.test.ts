import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Row } from '@penguin-couple/budget-ui/contracts';
import { ENTITY_SPECS } from '@penguin-couple/budget-ui/lib/v4/entity-config';
import { apiBridge, syntheticCommands, syntheticReads, resetSyntheticBudget } from './synthetic-budget';

const MONTH = '2026-08';
const KEY = 'family-budget-demo:v4';

async function rule(id: string, month = MONTH) {
  const rows = await syntheticReads.reconciliation(month, 'all');
  return rows.find(row => row.id === id);
}
async function resolveSeed() {
  await syntheticCommands.reconcile('rule-1', { month: MONTH, action: 'link-existing', actualEntity: 'transactions', actualId: 'tx-2' });
  await syntheticCommands.reconcile('rule-3', { month: MONTH, action: 'link-existing', actualEntity: 'purpose', actualId: 'purpose-1' });
  await syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'realize', date: '2026-08-01', actualAmount: 1200000 });
}

// Real storage serialization, but no dependency on a browser or another test's memory.
function storage() {
  const entries = new Map<string, string>();
  return {
    getItem(key: string) { return entries.get(key) ?? null; },
    setItem(key: string, value: string) { entries.set(key, value); },
    removeItem(key: string) { entries.delete(key); },
  };
}

describe('synthetic budget adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', storage());
    resetSyntheticBudget();
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('offers existing salary and savings first and links them without duplicating records', async () => {
    expect(await rule('rule-1')).toMatchObject({ candidateActual: { id: 'tx-2', entity: 'transactions', amount: 4200000, matchReasons: expect.arrayContaining(['owner', 'amount']) }, reconciliation: { state: 'pending' } });
    expect(await rule('rule-3')).toMatchObject({ candidateActual: { id: 'purpose-1', entity: 'purpose' } });
    for (let i = 0; i < 2; i++) {
      await syntheticCommands.reconcile('rule-1', { month: MONTH, action: 'link-existing', actualEntity: 'transactions', actualId: 'tx-2' });
      await syntheticCommands.reconcile('rule-3', { month: MONTH, action: 'link-existing', actualEntity: 'purpose', actualId: 'purpose-1' });
    }
    expect((await syntheticReads.entity('transactions', MONTH, 'all')).rows).toHaveLength(3);
    expect((await syntheticReads.entity('purpose', MONTH, 'all')).rows).toHaveLength(1);
    expect(await rule('rule-1')).toMatchObject({ actualIds: ['tx-2'], actualCount: 1, reconciliation: { state: 'matched' } });
    expect(await rule('rule-3')).toMatchObject({ actualIds: ['purpose-1'], reconciliation: { state: 'matched' } });
  });

  it('realizes signed expenses once, reports variance and rejects conflicting commands atomically', async () => {
    const payload = { month: MONTH, action: 'realize', date: '2026-08-01', actualAmount: 1250000 };
    await syntheticCommands.reconcile('rule-2', payload);
    const first = await rule('rule-2');
    await syntheticCommands.reconcile('rule-2', payload);
    expect(await rule('rule-2')).toEqual(first);
    expect(first).toMatchObject({ actualCount: 1, reconciliation: { state: 'variance', actualAmount: 1250000, difference: 50000 } });
    const rows = (await syntheticReads.entity('transactions', MONTH, 'all')).rows;
    expect(rows).toHaveLength(4);
    expect(rows.find(row => row.id === first?.actualId)).toMatchObject({ amount: -1250000, month: MONTH, date: '2026-08-01' });
    const saved = localStorage.getItem(KEY);
    await expect(syntheticCommands.reconcile('rule-2', { ...payload, actualAmount: 1 })).rejects.toThrow();
    await expect(syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'skip' })).rejects.toThrow();
    expect(localStorage.getItem(KEY)).toBe(saved);
  });

  it('persists occurrences across adapter recreation and accepts pre-occurrence browser data', async () => {
    await resolveSeed();
    vi.resetModules();
    // A static import cannot exercise a fresh module's persisted-state readback.
    const recreated = await import('./synthetic-budget');
    expect((await recreated.syntheticReads.reconciliation(MONTH, 'all')).every(row => (row.reconciliation as Row).state === 'matched')).toBe(true);
    const previous = JSON.parse(localStorage.getItem(KEY)!);
    delete previous.occurrences;
    localStorage.setItem(KEY, JSON.stringify(previous));
    expect(await rule('rule-1')).toMatchObject({ reconciliation: { state: 'pending' }, candidateActual: { id: 'tx-2' } });
    expect((await syntheticReads.entity('transactions', MONTH, 'all')).rows).toHaveLength(4);
  });

  it('skips, reopens and relinks without deleting financial history', async () => {
    await syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'skip' });
    await syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'skip' });
    expect(await rule('rule-2')).toMatchObject({ reconciliation: { state: 'skipped' } });
    await syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'reopen' });
    await syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'realize', date: '2026-08-01', actualAmount: 1200000 });
    const linked = await rule('rule-2');
    await syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'reopen' });
    expect(await rule('rule-2')).toMatchObject({ actualCount: 0, reconciliation: { state: 'pending' }, candidateActual: { id: linked?.actualId } });
    await syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'link-existing', actualEntity: 'transactions', actualId: linked?.actualId });
    expect((await syntheticReads.entity('transactions', MONTH, 'all')).rows).toHaveLength(4);
    expect(await rule('rule-2')).toMatchObject({ actualId: linked?.actualId, reconciliation: { state: 'matched' } });
  });

  it('surfaces deleted and mismatched linked actuals as orphaned, never fabricating replacement records', async () => {
    await resolveSeed();
    await syntheticCommands.remove('transactions', 'tx-2');
    expect(await rule('rule-1')).toMatchObject({ actualCount: 0, reconciliation: { state: 'orphaned' } });
    await syntheticCommands.update('purpose', 'purpose-1', { purpose_account: '비상금' });
    expect(await rule('rule-3')).toMatchObject({ actualCount: 0, reconciliation: { state: 'orphaned' } });
    expect((await syntheticReads.dashboard(MONTH, 'all')).close.close).toBe('마감 전');
  });

  it('rejects wrong-month, wrong-kind, invalid-date and already-claimed actuals without mutation', async () => {
    const saved = localStorage.getItem(KEY);
    for (const payload of [
      { month: '2026-09', action: 'link-existing', actualEntity: 'transactions', actualId: 'tx-2' },
      { month: MONTH, action: 'link-existing', actualEntity: 'purpose', actualId: 'purpose-1' },
      { month: MONTH, action: 'realize', date: '2026-08-32', actualAmount: 100 },
      { month: MONTH, action: 'realize', date: '2026-08-01', actualAmount: -100 },
      { month: MONTH, action: 'unknown' },
    ]) await expect(syntheticCommands.reconcile('rule-1', payload)).rejects.toThrow();
    expect(localStorage.getItem(KEY)).toBe(saved);
    await syntheticCommands.reconcile('rule-1', { month: MONTH, action: 'link-existing', actualEntity: 'transactions', actualId: 'tx-2' });
    const base = (await syntheticReads.entity('recurring', MONTH, 'all')).rows.find(row => row.id === 'rule-1')!;
    const duplicate = await syntheticCommands.create('recurring', MONTH, { ...base, name: '다른 급여' });
    expect(await rule(String(duplicate.id))).toMatchObject({ candidateCount: 0 });
    const before = localStorage.getItem(KEY);
    await expect(syntheticCommands.reconcile(String(duplicate.id), { month: MONTH, action: 'link-existing', actualEntity: 'transactions', actualId: 'tx-2' })).rejects.toThrow();
    expect(localStorage.getItem(KEY)).toBe(before);
  });

  it.each([['monthly', 400000], ['quarterly', 1200000], ['annual', 4800000]])('uses the canonical default-zero charge fallback for %s rules', async (billing_cycle, expectedAmount) => {
    const created = await syntheticCommands.create('recurring', MONTH, { ...ENTITY_SPECS.recurring.empty(MONTH), name: '새 고정지출', monthly_amount: 400000, billing_cycle });
    expect(await rule(String(created.id))).toMatchObject({ reconciliation: { expectedAmount } });
    await syntheticCommands.reconcile(String(created.id), { month: MONTH, action: 'realize', date: '2026-08-01', actualAmount: expectedAmount });
    expect(await rule(String(created.id))).toMatchObject({ reconciliation: { state: 'matched', actualAmount: expectedAmount } });
  });

  it('releases deleted-rule claims without deleting actuals or other rules links', async () => {
    await resolveSeed();
    const original = (await syntheticReads.entity('recurring', MONTH, 'all')).rows.find(row => row.id === 'rule-1')!;
    const actuals = (await syntheticReads.entity('transactions', MONTH, 'all')).rows;
    await syntheticCommands.remove('recurring', 'rule-1');
    const replacement = await syntheticCommands.create('recurring', MONTH, original);
    expect(await rule(String(replacement.id))).toMatchObject({ candidateActual: { id: 'tx-2' } });
    await syntheticCommands.reconcile(String(replacement.id), { month: MONTH, action: 'link-existing', actualEntity: 'transactions', actualId: 'tx-2' });
    expect((await syntheticReads.entity('transactions', MONTH, 'all')).rows).toEqual(actuals);
    expect(await rule('rule-3')).toMatchObject({ actualId: 'purpose-1', reconciliation: { state: 'matched' } });
  });

  it('separates occurrences by month and honors active dates, one-time, excluded and billing schedules', async () => {
    await syntheticCommands.reconcile('rule-1', { month: MONTH, action: 'skip' });
    expect(await rule('rule-1', '2026-09')).toMatchObject({ reconciliation: { state: 'pending' }, candidateCount: 0 });
    await syntheticCommands.update('recurring', 'rule-2', { start_month: '2026-08', end_month: '2026-10', billing_cycle: 'quarterly', billing_months: '' });
    expect(await rule('rule-2', '2026-07')).toBeUndefined();
    expect(await rule('rule-2', '2026-08')).toBeDefined();
    expect(await rule('rule-2', '2026-09')).toBeUndefined();
    expect(await rule('rule-2', '2026-11')).toBeUndefined();
    await syntheticCommands.update('recurring', 'rule-2', { end_month: '', billing_cycle: 'annual', billing_months: '8, 11' });
    expect(await rule('rule-2', '2026-11')).toBeDefined();
    await syntheticCommands.update('recurring', 'rule-2', { cadence: 'one-time' });
    expect(await rule('rule-2', '2026-11')).toBeUndefined();
    await syntheticCommands.update('recurring', 'rule-2', { reconciliation_mode: 'excluded' });
    expect(await rule('rule-2')).toBeUndefined();
    await expect(syntheticCommands.reconcile('rule-2', { month: MONTH, action: 'skip' })).rejects.toThrow();
  });

  it('blocks unresolved rows, transaction checks and negative purpose balances, restoring readiness after resolution', async () => {
    expect((await syntheticReads.dashboard(MONTH, 'all')).close).toMatchObject({ needCheck: '3건', close: '마감 전' });
    await resolveSeed();
    const resolved = await syntheticReads.dashboard(MONTH, 'all');
    expect(resolved.decision.tone).toBe('ready');
    expect(resolved.summary).toMatchObject({ realizedFixedSpending: 1200000, actualSpending: 1522000, projectedSpending: 1522000, plannedSurplus: 2178000 });
    await syntheticCommands.update('transactions', 'tx-1', { status: '확인 필요' });
    expect((await syntheticReads.dashboard(MONTH, 'all')).close.close).toBe('마감 전');
    await syntheticCommands.update('transactions', 'tx-1', { status: '정상' });
    await syntheticCommands.update('purpose', 'purpose-1', { amount: 100000 });
    const risk = await syntheticReads.dashboard(MONTH, 'all');
    expect(risk.close.close).toBe('마감 전');
    expect(risk.decision).toMatchObject({ tone: 'needs-check', purposeRisk: { account: '여행', balance: -180000 } });
    await syntheticCommands.update('purpose', 'purpose-1', { amount: 500000 });
    const restored = await syntheticReads.dashboard(MONTH, 'all');
    expect(restored.close.close).toBe('마감 가능');
    expect(restored.decision.tone).toBe('ready');
  });

  it('does not use another month purpose or asset inputs to declare readiness', async () => {
    for (const id of ['rule-1', 'rule-2', 'rule-3']) await syntheticCommands.reconcile(id, { month: '2026-09', action: 'skip' });
    const september = await syntheticReads.dashboard('2026-09', 'all');
    expect(september.close).toMatchObject({ needCheck: '0건', purpose: '입력 필요', assets: '입력 필요', close: '마감 전' });
    expect(september.decision.tone).toBe('needs-check');
  });

  it('allocates unique stable IDs even for simultaneous creates', async () => {
    const rows = await Promise.all(Array.from({ length: 8 }, () => syntheticCommands.create('transactions', MONTH, { date: '2026-08-13', amount: -1 })));
    expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
    expect((await syntheticReads.entity('transactions', MONTH, 'all')).rows).toHaveLength(11);
  });

  it('routes bridge GETs without writes, accepts POST commands and rejects invalid methods or malformed bodies', async () => {
    const before = localStorage.getItem(KEY);
    expect((await apiBridge('/api/transactions?month=2026-08')).status).toBe(200);
    expect((await apiBridge('/api/recurring/rule-1/realize')).status).toBe(405);
    expect(localStorage.getItem(KEY)).toBe(before);
    const linked = await apiBridge('/api/recurring/rule-1/realize', { method: 'POST', body: JSON.stringify({ month: MONTH, action: 'link-existing', actualEntity: 'transactions', actualId: 'tx-2' }) });
    expect(linked.status).toBe(200);
    expect(await rule('rule-1')).toMatchObject({ actualId: 'tx-2' });
    const saved = localStorage.getItem(KEY);
    expect((await apiBridge('/api/transactions', { method: 'PATCH', body: '{}' })).status).toBe(405);
    expect((await apiBridge('/api/recurring/rule-2/realize', { method: 'POST', body: '{' })).status).toBe(400);
    expect(localStorage.getItem(KEY)).toBe(saved);
  });

  it('never calls operational network APIs for reads or reconciliation writes', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await resolveSeed();
    await syntheticReads.dashboard(MONTH, 'all');
    await syntheticReads.settings();
    await apiBridge('/api/recurring/reconciliation?month=2026-08');
    expect(spy).not.toHaveBeenCalled();
  });
});
