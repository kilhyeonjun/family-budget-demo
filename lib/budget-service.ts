// lib/budget-service.ts - GREEN phase: Minimal implementation to pass tests

import type { BudgetData, Transaction } from './types';

export interface DashboardSummary {
  income: number;
  expenses: number;
  balance: number;
}

export class BudgetService {
  private data: BudgetData;

  constructor(data: BudgetData) {
    this.data = data;
  }

  getTransactions(): Transaction[] {
    return [...this.data.transactions].sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
  }

  addTransaction(transaction: Transaction): void {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: transaction.type || 'expense',
    };
    this.data.transactions.push(newTransaction);
  }

  getDashboardSummary(month: string): DashboardSummary {
    const monthTransactions = this.data.transactions.filter((tx) =>
      tx.date.startsWith(month)
    );

    const income = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = monthTransactions
      .filter((tx) => !tx.type || tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }
}
