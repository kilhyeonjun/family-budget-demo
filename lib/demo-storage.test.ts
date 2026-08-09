import { describe, expect, it } from 'vitest';
import seed from '@/demo/seed-data.json';
import { appendDemoTransaction, calculateDemoSummary } from './demo-storage';
import type { BudgetData } from './types';

const demoSeed = seed as BudgetData;
const newExpense = {
  date: '2026-06-30', owner: 'alex', category: 'groceries', description: 'Demo write', amount: 1000, type: 'expense' as const,
};

describe('demo storage', () => {
  it('appends a submitted transaction with a stable demo id', () => {
    const next = appendDemoTransaction(demoSeed, newExpense);
    expect(next.transactions).toHaveLength(demoSeed.transactions.length + 1);
    expect(next.transactions.at(-1)).toMatchObject({ description: 'Demo write', id: expect.stringMatching(/^demo-tx-/) });
  });

  it('recalculates the dashboard from the persisted transaction set', () => {
    const next = appendDemoTransaction(demoSeed, newExpense);
    const before = calculateDemoSummary(demoSeed.transactions, '2026-06');
    const after = calculateDemoSummary(next.transactions, '2026-06');
    expect(after.expenses).toBe(before.expenses + 1000);
    expect(after.balance).toBe(before.balance - 1000);
  });
});
