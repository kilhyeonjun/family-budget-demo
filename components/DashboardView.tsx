// components/DashboardView.tsx - GREEN phase: Minimal implementation to pass tests

'use client';

import Link from 'next/link';
import { Card } from '@heroui/react';
import type { DashboardSummary } from '@/lib/budget-service';
import type { Transaction } from '@/lib/types';

interface DashboardViewProps {
  summary: DashboardSummary;
  recentTransactions: Transaction[];
  currentMonth: string;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export default function DashboardView({
  summary,
  recentTransactions,
  currentMonth,
}: DashboardViewProps) {
  return (
    <div className="min-h-screen p-4 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">{currentMonth}</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">수입 (Income)</div>
          <div className="text-2xl font-bold text-blue-600">
            ₩{formatCurrency(summary.income)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">지출 (Expenses)</div>
          <div className="text-2xl font-bold text-red-600">
            ₩{formatCurrency(summary.expenses)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">잔액 (Balance)</div>
          <div className="text-2xl font-bold text-green-600">
            ₩{formatCurrency(summary.balance)}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center border-b pb-3 last:border-b-0"
            >
              <div>
                <div className="font-medium">{tx.description}</div>
                <div className="text-sm text-gray-600">
                  {tx.date} · {tx.category}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold ${
                    tx.type === 'income' ? 'text-blue-600' : 'text-red-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}₩
                  {formatCurrency(tx.amount)}
                </div>
                <div className="text-xs text-gray-500">{tx.owner}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          href="/add"
          className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Add Transaction
        </Link>
        <Link
          href="/ledger"
          className="flex-1 bg-gray-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          View Ledger
        </Link>
      </div>
    </div>
  );
}
