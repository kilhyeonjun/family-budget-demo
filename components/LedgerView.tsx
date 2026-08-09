// components/LedgerView.tsx - GREEN phase: Minimal implementation

'use client';

import Link from 'next/link';
import { Card } from '@heroui/react';
import type { Transaction } from '@/lib/types';

interface LedgerViewProps {
  transactions: Transaction[];
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export default function LedgerView({ transactions }: LedgerViewProps) {
  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ledger</h1>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back
        </Link>
      </header>

      <Card className="p-6">
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <div
              key={tx.id ?? `${tx.date}-${tx.owner}-${tx.description}-${index}`}
              className="flex justify-between items-start border-b pb-4 last:border-b-0"
            >
              <div className="flex-1">
                <div className="font-semibold text-lg">{tx.description}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {tx.date} · {tx.category} · {tx.owner}
                </div>
              </div>
              <div className="text-right ml-4">
                <div
                  className={`text-xl font-bold ${
                    tx.type === 'income' ? 'text-blue-600' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}₩
                  {formatCurrency(tx.amount)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tx.type === 'income' ? 'Income' : 'Expense'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
