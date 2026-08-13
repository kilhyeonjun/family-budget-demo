import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syntheticCommands, syntheticReads, resetSyntheticBudget } from './synthetic-budget';

describe('synthetic budget adapter', () => {
  beforeEach(() => resetSyntheticBudget());

  it('persists a created transaction and reads it after adapter recreation', async () => {
    const created = await syntheticCommands.create('transactions', '2026-08', {
      date: '2026-08-13', owner_type: '공동', major_category: '식비', description: '테스트 저녁', amount: -25000,
    });
    expect(created.id).toBeTruthy();
    expect((await syntheticReads.entity('transactions', '2026-08', 'all')).rows.some(row => row.id === created.id)).toBe(true);
  });

  it('never uses network APIs', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await syntheticReads.dashboard('2026-08', 'all');
    await syntheticReads.settings();
    expect(spy).not.toHaveBeenCalled();
  });
});
