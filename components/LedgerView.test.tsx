// components/LedgerView.test.tsx - RED phase: Test ledger component

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LedgerView from './LedgerView';
import type { Transaction } from '@/lib/types';

describe('LedgerView', () => {
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
    {
      id: 'tx-3',
      date: '2026-06-25',
      owner: 'alex',
      category: 'salary',
      description: 'Monthly salary',
      amount: 4200000,
      type: 'income',
    },
  ];

  it('should render ledger title', () => {
    render(<LedgerView transactions={mockTransactions} />);
    expect(screen.getByText(/Ledger/i)).toBeDefined();
  });

  it('should display all transactions', () => {
    render(<LedgerView transactions={mockTransactions} />);
    
    expect(screen.getByText('Weekly groceries')).toBeDefined();
    expect(screen.getByText('Transit card')).toBeDefined();
    expect(screen.getByText('Monthly salary')).toBeDefined();
  });

  it('should show transaction amounts with proper formatting', () => {
    render(<LedgerView transactions={mockTransactions} />);
    
    expect(screen.getByText(/84,320/)).toBeDefined();
    expect(screen.getByText(/55,000/)).toBeDefined();
    expect(screen.getByText(/4,200,000/)).toBeDefined();
  });

  it('should have a back link to dashboard', () => {
    render(<LedgerView transactions={mockTransactions} />);
    
    const links = screen.getAllByRole('link');
    const backLink = links.find((link) => link.getAttribute('href') === '/');
    
    expect(backLink).toBeDefined();
  });

  it('should display transaction categories and dates', () => {
    render(<LedgerView transactions={mockTransactions} />);
    
    // Use getAllByText for categories that may appear multiple times
    expect(screen.getAllByText(/groceries/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/transport/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/salary/i).length).toBeGreaterThan(0);
    
    // Dates should be unique
    expect(screen.getByText(/2026-06-10/)).toBeDefined();
    expect(screen.getByText(/2026-06-09/)).toBeDefined();
  });
});
