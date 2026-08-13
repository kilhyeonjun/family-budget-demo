'use client';

import { useEffect, useState } from 'react';
import { QuickEntryForm } from './quick-entry-form';
import { RecentList } from './recent-list';

type Row = { id: string; date?: string; description?: string; amount?: number; major_category?: string; budget_treatment?: string };
type Settings = { categories?: string[]; purposeAccounts?: string[]; paymentMethods?: string[]; budgetTreatments?: string[] };

export function TodayClient({ month, owner, settings, initialRows }: {
  month: string; owner: string; settings: Settings; initialRows: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);

  useEffect(() => { setRows(initialRows); }, [initialRows, month, owner]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,380px)] items-start">
      <QuickEntryForm month={month} owner={owner} settings={settings}
        onSaved={row => setRows(prev => [row as Row, ...prev])} />
      <div className="grid gap-2 lg:sticky lg:top-20">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-[var(--fbv4-secondary)]">최근 내역</p>
          <a href={`/v4/ledger?month=${encodeURIComponent(month)}&owner=${encodeURIComponent(owner)}`} className="inline-flex h-11 items-center text-sm font-bold text-[var(--fbv4-accent)] hover:underline">원장 전체보기</a>
        </div>
        <RecentList rows={rows} />
      </div>
    </div>
  );
}
