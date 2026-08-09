// lib/budget-service.test.ts - Fixed: Fresh data copy per test

import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetService } from './budget-service';
import type { BudgetData, Transaction } from './types';

describe('BudgetService', () => {
  let service: BudgetService;

  // Factory function to create fresh data for each test
  const createMockData = (): BudgetData => ({
    households: [
      {
        id: 'demo-household-alpha',
        name: 'Demo Household',
        members: [
          { id: 'demo-user-alex', displayName: 'Alex', role: 'owner' },
          { id: 'demo-user-jamie', displayName: 'Jamie', role: 'editor' },
        ],
      },
    ],
    transactions: [
      {
        date: '2026-06-02',
        owner: 'shared',
        category: 'groceries',
        description: 'Weekly groceries',
        amount: 84320,
      },
      {
        date: '2026-06-03',
        owner: 'alex',
        category: 'transport',
        description: 'Transit card top-up',
        amount: 55000,
      },
    ],
    purposeAccounts: [],
    assets: [],
    recurring: [],
  });

  beforeEach(() => {
    service = new BudgetService(createMockData());
  });

  describe('getTransactions', () => {
    it('should return all transactions', () => {
      const transactions = service.getTransactions();
      expect(transactions).toHaveLength(2);
    });

    it('should return transactions sorted by date descending', () => {
      const transactions = service.getTransactions();
      expect(transactions[0].date).toBe('2026-06-03'); // Latest first
      expect(transactions[1].date).toBe('2026-06-02');
      expect(transactions[0].description).toBe('Transit card top-up');
    });
  });

  describe('addTransaction', () => {
    it('should add a new transaction', () => {
      const newTx: Transaction = {
        date: '2026-06-10',
        owner: 'alex',
        category: 'food',
        description: 'Lunch',
        amount: 12000,
        type: 'expense',
      };

      service.addTransaction(newTx);
      const transactions = service.getTransactions();
      
      expect(transactions).toHaveLength(3);
      const added = transactions.find((t) => t.description === 'Lunch');
      expect(added).toBeDefined();
      expect(added?.amount).toBe(12000);
    });

    it('should assign a unique id to new transaction', () => {
      const newTx: Transaction = {
        date: '2026-06-10',
        owner: 'alex',
        category: 'food',
        description: 'Dinner',
        amount: 15000,
      };

      service.addTransaction(newTx);
      const transactions = service.getTransactions();
      const added = transactions.find((t) => t.description === 'Dinner');
      
      expect(added?.id).toBeDefined();
      expect(typeof added?.id).toBe('string');
    });
  });

  describe('getDashboardSummary', () => {
    it('should calculate total income for current month', () => {
      const dataWithIncome: BudgetData = {
        ...createMockData(),
        transactions: [
          {
            date: '2026-06-25',
            owner: 'alex',
            category: 'salary',
            description: 'Monthly salary',
            amount: 4200000,
            type: 'income',
          },
          {
            date: '2026-06-02',
            owner: 'shared',
            category: 'groceries',
            description: 'Groceries',
            amount: 84320,
            type: 'expense',
          },
        ],
      };
      const serviceWithIncome = new BudgetService(dataWithIncome);
      
      const summary = serviceWithIncome.getDashboardSummary('2026-06');
      expect(summary.income).toBe(4200000);
    });

    it('should calculate total expenses for current month', () => {
      const summary = service.getDashboardSummary('2026-06');
      expect(summary.expenses).toBe(84320 + 55000);
    });

    it('should calculate balance as income minus expenses', () => {
      const dataWithIncome: BudgetData = {
        ...createMockData(),
        transactions: [
          {
            date: '2026-06-25',
            owner: 'alex',
            category: 'salary',
            description: 'Salary',
            amount: 4200000,
            type: 'income',
          },
          {
            date: '2026-06-02',
            owner: 'shared',
            category: 'groceries',
            description: 'Groceries',
            amount: 100000,
            type: 'expense',
          },
        ],
      };
      const serviceWithIncome = new BudgetService(dataWithIncome);
      
      const summary = serviceWithIncome.getDashboardSummary('2026-06');
      expect(summary.balance).toBe(4200000 - 100000);
    });
  });
});
