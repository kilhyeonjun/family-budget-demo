'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import type { BudgetData } from '@/lib/types';
import { calculateDemoSummary, readDemoData, resetDemoData } from '@/lib/demo-storage';

const formatCurrency = (amount: number) => amount.toLocaleString('ko-KR');

export default function DemoBudgetApp({ seed }: { seed: BudgetData }) {
  const [data, setData] = useState(seed);
  const currentMonth = '2026-06';

  useEffect(() => {
    const sync = () => setData(readDemoData(seed));
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('demo-budget-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('demo-budget-updated', sync);
    };
  }, [seed]);

  const summary = calculateDemoSummary(data.transactions, currentMonth);
  const recentTransactions = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      <div role="note" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Synthetic demo only.</strong> No real family data or external database. Entries stay in this browser.
        <button className="ml-3 underline min-h-11" type="button" onClick={() => { resetDemoData(); setData(seed); }}>Reset demo</button>
      </div>
      <header className="mb-6"><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-gray-600 mt-1">{currentMonth}</p></header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[['수입 (Income)', summary.income, 'text-blue-600'], ['지출 (Expenses)', summary.expenses, 'text-red-600'], ['잔액 (Balance)', summary.balance, 'text-green-600']].map(([label, amount, color]) => (
          <Card key={String(label)} className="p-6"><div className="text-sm text-gray-600 mb-1">{label}</div><div className={`text-2xl font-bold ${color}`}>₩{formatCurrency(Number(amount))}</div></Card>
        ))}
      </div>
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-3">{recentTransactions.map((tx, index) => (
          <div key={tx.id ?? `${tx.date}-${tx.description}-${index}`} className="flex justify-between items-center border-b pb-3 last:border-b-0">
            <div><div className="font-medium">{tx.description}</div><div className="text-sm text-gray-600">{tx.date} · {tx.category}</div></div>
            <div className="text-right"><div className={`font-bold ${tx.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>{tx.type === 'income' ? '+' : '-'}₩{formatCurrency(tx.amount)}</div><div className="text-xs text-gray-500">{tx.owner}</div></div>
          </div>
        ))}</div>
      </Card>
      <div className="flex gap-4"><Link href="/add" className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold">Add Transaction</Link><Link href="/ledger" className="flex-1 bg-gray-700 text-white text-center py-3 rounded-lg font-semibold">View Ledger</Link></div>
    </main>
  );
}
