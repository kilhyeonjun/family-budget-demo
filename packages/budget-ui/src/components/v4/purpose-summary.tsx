import type { PurposeAccountRow } from '../../contracts';

function won(v: number) { return `${v.toLocaleString('ko-KR')}원`; }

export function PurposeSummary({ rows }: { rows: PurposeAccountRow[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-[var(--fbv4-hairline)] p-6 shadow-[var(--fbv4-shadow-card)]">
        <p className="text-[var(--fbv4-secondary)]">이번 달 목적통장 입금·사용 기록이 아직 없어요. 아래 표에서 입금을 추가해 보세요.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 overflow-hidden rounded-[var(--fbv4-radius-card)] border border-[var(--fbv4-hairline)] bg-[var(--fbv4-surface)] shadow-[var(--fbv4-shadow-card)]">
      {rows.map((r, index) => (
        <article key={r.account} className={`grid gap-3 p-4 ${index > 0 ? 'border-l border-[var(--fbv4-hairline)]' : ''} ${index > 1 ? 'max-xl:border-t' : ''} max-xl:[&:nth-child(odd)]:border-l-0`}>
          <p className="text-sm font-extrabold">{r.account}</p>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
            <dt className="font-bold text-[var(--fbv4-muted)]">입금</dt><dd className="m-0 text-right fbv4-num fbv4-money-in font-bold">{won(r.deposits)}</dd>
            <dt className="font-bold text-[var(--fbv4-muted)]">사용</dt><dd className="m-0 text-right fbv4-num fbv4-money-out font-bold">{won(r.usage)}</dd>
            <dt className="font-bold text-[var(--fbv4-muted)]">잔액</dt><dd className={`m-0 text-right fbv4-num font-extrabold ${r.balance < 0 ? 'fbv4-money-out' : ''}`}>{won(r.balance)}</dd>
          </dl>
        </article>
      ))}
    </div>
  );
}
