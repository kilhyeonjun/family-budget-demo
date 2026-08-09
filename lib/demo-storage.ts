import type { BudgetData, Transaction } from './types';

export const DEMO_STORAGE_KEY = 'family-budget-demo:v1';

export function appendDemoTransaction(
  data: BudgetData,
  transaction: Omit<Transaction, 'id'>,
): BudgetData {
  return {
    ...data,
    transactions: [
      ...data.transactions,
      { ...transaction, id: `demo-tx-${Date.now()}` },
    ],
  };
}

export function calculateDemoSummary(transactions: Transaction[], month: string) {
  const monthly = transactions.filter((transaction) => transaction.date.startsWith(month));
  const income = monthly
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = monthly
    .filter((transaction) => transaction.type !== 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  return { income, expenses, balance: income - expenses };
}

export function readDemoData(seed: BudgetData): BudgetData {
  if (typeof window === 'undefined') return seed;
  try {
    const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return stored ? JSON.parse(stored) as BudgetData : seed;
  } catch {
    return seed;
  }
}

export function writeDemoData(data: BudgetData): void {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('demo-budget-updated'));
}

export function resetDemoData(): void {
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
  window.dispatchEvent(new Event('demo-budget-updated'));
}
