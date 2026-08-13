import type { MonthlyDecision } from '../../lib/monthly-decision';

const TONE: Record<string, { bg: string; border: string; text: string }> = {
  'ready': { bg: 'bg-[#ecfdf5]', border: 'border-[#a7f3d0]', text: 'text-[var(--fbv4-income)]' },
  'reduce-needed': { bg: 'bg-[#fef2f2]', border: 'border-[#fecaca]', text: 'text-[var(--fbv4-expense)]' },
  'needs-check': { bg: 'bg-[#fff7ed]', border: 'border-[#fed7aa]', text: 'text-[#c2410c]' },
};

export function DecisionBadge({ decision, plannedSurplus }: { decision: MonthlyDecision; plannedSurplus: number }) {
  const tone = TONE[decision.tone] ?? TONE['needs-check'];
  return (
    <div className={`rounded-2xl border ${tone.bg} ${tone.border} p-5 flex flex-wrap items-center justify-between gap-3`}>
      <div className="grid gap-1">
        <span className={`text-xs font-extrabold ${tone.text}`}>이번 달 판단</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{decision.badge}</h2>
        <p className="text-sm text-[var(--fbv4-secondary)] font-medium">{decision.reason}</p>
      </div>
      <div className="text-right">
        <span className="text-xs font-bold text-[var(--fbv4-muted)]">이번 달 예상 잉여</span>
        <p className={`fbv4-num text-2xl font-extrabold ${plannedSurplus < 0 ? 'fbv4-money-out' : 'fbv4-money-in'}`}>
          {plannedSurplus < 0 ? '−' : ''}{new Intl.NumberFormat('ko-KR').format(Math.abs(plannedSurplus))}원
        </p>
      </div>
    </div>
  );
}
