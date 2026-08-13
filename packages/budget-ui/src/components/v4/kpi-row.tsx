import type { MonthlySummary } from '../../contracts';

function won(n: number) { return new Intl.NumberFormat('ko-KR').format(Math.round(n)); }

export function KpiRow({ summary }: { summary: MonthlySummary }) {
  const items = [
    { label: '예상 수입', value: summary.expectedIncome, note: '예상 항목 기준', tone: 'in' as const, kind: '계획' },
    { label: '실제 수입', value: summary.actualIncome, note: '거래 원장 입금 합계', tone: 'in' as const, kind: '실제' },
    { label: '예상 지출', value: summary.projectedSpending, note: '월 예산 + 변동 거래', tone: 'out' as const, kind: '계획' },
    { label: '실제 지출', value: summary.actualSpending, note: '거래 원장 출금 합계', tone: 'out' as const, kind: '실제' },
    { label: '예상 저축', value: summary.expectedSavings, note: '예상 항목 기준', tone: 'neutral' as const, kind: '계획', wide: true },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--fbv4-hairline)] grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-px bg-[var(--fbv4-hairline)]">
      {items.map(it => (
        <div key={it.label} className={`bg-[var(--fbv4-surface)] p-4 grid gap-1 ${it.wide ? 'col-span-2 md:col-span-1' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--fbv4-secondary)]">{it.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${it.kind === '실제' ? 'bg-[#EEF4FF] text-[#43628F]' : 'bg-[var(--fbv4-subtle)] text-[var(--fbv4-secondary)]'}`}>{it.kind}</span>
          </div>
          <span className={`fbv4-num text-xl font-extrabold ${it.tone === 'in' ? 'fbv4-money-in' : it.tone === 'out' ? 'fbv4-money-out' : ''}`}>{won(it.value)}</span>
          {it.note && <span className="text-xs font-bold text-[var(--fbv4-muted)]">{it.note}</span>}
        </div>
      ))}
    </div>
  );
}
