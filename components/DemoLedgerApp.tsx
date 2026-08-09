'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BudgetData } from '@/lib/types';
import { readDemoData } from '@/lib/demo-storage';
import LedgerView from './LedgerView';

export default function DemoLedgerApp({ seed }: { seed: BudgetData }) {
  const [data, setData] = useState(seed);
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
  return <><div className="max-w-7xl mx-auto px-4 pt-4 text-sm"><strong>Synthetic browser-local ledger.</strong> <Link className="underline" href="/">Dashboard</Link></div><LedgerView transactions={[...data.transactions].sort((a, b) => b.date.localeCompare(a.date))} /></>;
}
