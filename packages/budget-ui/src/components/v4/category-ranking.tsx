function won(n: number) { return new Intl.NumberFormat('ko-KR').format(Math.round(n)); }

export function CategoryRanking({ categories }: { categories: { category: string; amount: number }[] }) {
  if (!categories.length) {
    return <div className="rounded-2xl border border-[var(--fbv4-hairline)] p-6 text-[var(--fbv4-muted)]">지출 내역이 아직 없어요.</div>;
  }
  // 분모는 표시분 합계 — 각 막대가 전체 지출 대비 점유율을 나타냄(자기참조 max 아님).
  const total = categories.reduce((s, c) => s + c.amount, 0) || 1;
  return (
    <div className="rounded-2xl border border-[var(--fbv4-hairline)] p-4 grid gap-3">
      <span className="text-sm font-bold">카테고리별 지출</span>
      <div className="grid gap-2.5">
        {categories.map(c => (
          <div key={c.category} className="grid gap-1">
            <div className="flex justify-between text-sm">
              <span className="font-bold">{c.category}</span>
              <span className="fbv4-num font-bold text-[var(--fbv4-secondary)]">
                {won(c.amount)} <span className="text-[var(--fbv4-muted)] font-normal">{Math.round((c.amount / total) * 100)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--fbv4-subtle)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--fbv4-expense)]" style={{ width: `${Math.max(4, (c.amount / total) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
