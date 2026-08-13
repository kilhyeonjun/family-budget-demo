'use client';

import { classifyTransaction } from '@/lib/aggregate';

type Row = { id: string; date?: string; description?: string; amount?: number; major_category?: string; budget_treatment?: string };

function won(n: number) {
  return new Intl.NumberFormat('ko-KR').format(Math.abs(n));
}

export function RecentList({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return <div className="rounded-2xl border border-[var(--fbv4-hairline)] p-6 text-[var(--fbv4-muted)]">아직 이번 달 내역이 없어요.</div>;
  }
  return (
    <div className="rounded-2xl border border-[var(--fbv4-hairline)] divide-y divide-[var(--fbv4-hairline)] overflow-hidden">
      {rows.map(r => {
        const amt = Number(r.amount ?? 0);
        const income = classifyTransaction(r) === 'income';
        return (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{r.description || '(내용 없음)'}</p>
              <p className="text-xs text-[var(--fbv4-muted)]">{r.date} · {r.major_category}</p>
            </div>
            <span className={`fbv4-num font-extrabold ${income ? 'fbv4-money-in' : 'fbv4-money-out'}`}>
              {income ? '+' : '−'}{won(amt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
