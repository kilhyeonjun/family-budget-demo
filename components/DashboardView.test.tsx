// components/DashboardView.test.tsx - RED phase: Test dashboard component

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardView from './DashboardView';
import type { DashboardSummary } from '@/lib/budget-service';
import type { Transaction } from '@/lib/types';

describe('DashboardView', () => {
  const mockSummary: DashboardSummary = {
    income: 4200000,
    expenses: 1500000,
    balance: 2700000,
  };

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: '2026-06-10',
      owner: 'alex',
      category: 'groceries',
      description: 'Weekly groceries',
      amount: 84320,
      type: 'expense',
    },
    {
      id: 'tx-2',
      date: '2026-06-09',
      owner: 'jamie',
      category: 'transport',
      description: 'Transit card',
      amount: 55000,
      type: 'expense',
    },
  ];

  it('should render dashboard title', () => {
    render(
      <DashboardView
        summary={mockSummary}
        recentTransactions={mockTransactions}
        currentMonth="2026-06"
      />
    );

    expect(screen.getByText(/Dashboard/i)).toBeDefined();
  });

  it('should display income, expenses, and balance', () => {
    render(
      <DashboardView
        summary={mockSummary}
        recentTransactions={mockTransactions}
        currentMonth="2026-06"
      />
    );

    expect(screen.getByText(/4,200,000/)).toBeDefined();
    expect(screen.getByText(/1,500,000/)).toBeDefined();
    expect(screen.getByText(/2,700,000/)).toBeDefined();
  });

  it('should display recent transactions', () => {
    render(
      <DashboardView
        summary={mockSummary}
        recentTransactions={mockTransactions}
        currentMonth="2026-06"
      />
    );

    expect(screen.getByText('Weekly groceries')).toBeDefined();
    expect(screen.getByText('Transit card')).toBeDefined();
  });

  it('should have links to add transaction and view ledger', () => {
    render(
      <DashboardView
        summary={mockSummary}
        recentTransactions={mockTransactions}
        currentMonth="2026-06"
      />
    );

    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));
    
    expect(hrefs).toContain('/add');
    expect(hrefs).toContain('/ledger');
  });
});
