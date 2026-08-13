'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiBridge } from '@/lib/synthetic-budget';

type Reconciliation = { state: 'pending' | 'matched' | 'variance' | 'skipped' | 'orphaned'; status: '미반영' | '확인' | '차이' | '건너뜀' | '연결끊김'; expectedAmount: number; actualAmount: number; difference: number };
type Candidate = { id: string; entity: 'transactions' | 'purpose'; date: string; amount: number; matchScore?: number; matchReasons?: string[] };
type Rule = {
  id: string; item_type: string; name: string; owner_type: string; monthly_amount: number;
  expected_charge_amount: number; billing_cycle: string; billing_months: string; reconciliation_mode: string;
  purpose_account: string; expected_day: number; occurrenceId: string; actualId: string; actualDate: string;
  actualIds: string[]; actualCount: number;
  candidateActual: Candidate | null;
  candidateActuals: Candidate[];
  candidateCount: number;
  reconciliation: Reconciliation;
};

function won(value: number) { return `${Math.abs(value).toLocaleString('ko-KR')}원`; }
function billingCycleLabel(value: string) { return value === 'annual' ? '연간' : value === 'quarterly' ? '분기' : '매월'; }
function candidateReasonLabel(reason: string) {
  return ({ name: '이름', owner: '부담 주체', amount: '금액', category: '분류', payment: '결제수단', date: '날짜', purpose: '목적통장' } as Record<string, string>)[reason] || reason;
}
function expectedDate(month: string, day: number) {
  const [year, m] = month.split('-').map(Number);
  const last = new Date(year, m, 0).getDate();
  return `${month}-${String(Math.max(1, Math.min(Number(day) || 1, last))).padStart(2, '0')}`;
}

export function RecurringReconciliation({ month, owner }: { month: string; owner: string }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [ignoredCandidates, setIgnoredCandidates] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'action' | 'all' | Reconciliation['state']>('action');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [pendingLink, setPendingLink] = useState<{ rule: Rule; candidate: Candidate } | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const submissionLock = useRef(false);

  const load = useCallback(async () => {
    const response = await apiBridge(`/api/recurring/reconciliation?month=${encodeURIComponent(month)}&owner=${encodeURIComponent(owner)}`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(body.rows)) throw new Error(body.error || '반영 상태를 불러오지 못했어요.');
    const next = body.rows as Rule[];
    setRules(next);
    setDates(current => Object.fromEntries(next.map(rule => [rule.id, current[rule.id] || rule.actualDate || expectedDate(month, rule.expected_day)])));
    setAmounts(current => Object.fromEntries(next.map(rule => [rule.id, current[rule.id] || String(rule.reconciliation.actualAmount || rule.reconciliation.expectedAmount)])));
  }, [month, owner]);

  useEffect(() => {
    setLoading(true); setMessage('');
    load().catch(error => setMessage(error instanceof Error ? error.message : '조회 실패')).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (pendingLink && !dialog.open) dialog.showModal();
    if (!pendingLink && dialog.open) dialog.close();
  }, [pendingLink]);

  async function submit(rule: Rule, action: 'realize' | 'skip' | 'link-existing' | 'reopen', candidate?: Candidate, confirmed = false) {
    if (busy || submissionLock.current) return;
    if (action === 'skip' && !window.confirm(`${rule.name}의 ${month} 실제 반영을 건너뛸까요?`)) return;
    if (action === 'reopen' && !window.confirm(`${rule.name}의 ${month} 연결을 풀고 다시 열까요?`)) return;
    if (action === 'realize' && !window.confirm(`${rule.name}을 ${dates[rule.id]} · ${won(Number(amounts[rule.id]))}으로 원장에 실제 반영할까요?`)) return;
    if (action === 'link-existing' && candidate && !confirmed) { setPendingLink({ rule, candidate }); return; }
    submissionLock.current = true;
    setBusy(rule.id); setMessage('');
    const payload = action === 'skip' || action === 'reopen'
      ? { month, action }
      : action === 'link-existing' && candidate
        ? { month, action, actualEntity: candidate.entity, actualId: candidate.id }
        : { month, action, date: dates[rule.id], actualAmount: Number(amounts[rule.id]) };
    try {
      const response = await apiBridge(`/api/recurring/${rule.id}/realize`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 409 ? '이미 실제 반영된 항목입니다.' : (body.error || '반영하지 못했어요.'));
      setMessage(action === 'skip' ? '건너뜀으로 표시했어요.' : action === 'reopen' ? '연결을 풀고 다시 열었어요.' : '원장에 연결해 실제 반영했어요.');
      try { await load(); } catch { setMessage('저장은 완료됐지만 재조회에 실패했어요. 다시 저장하지 말고 새로고침하세요.'); }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '반영 실패');
    } finally {
      submissionLock.current = false;
      setBusy('');
    }
  }

  if (loading) return <div className="h-32 rounded-2xl bg-[var(--fbv4-subtle)] animate-pulse" aria-label="실제 반영 상태 불러오는 중" />;
  if (rules.length === 0) return <p className="rounded-2xl border border-dashed border-[var(--fbv4-hairline)] p-6 text-sm font-bold text-[var(--fbv4-muted)]">이번 달에 적용되는 규칙이 없습니다.</p>;
  const counts = rules.reduce((acc, rule) => { acc[rule.reconciliation.state] = (acc[rule.reconciliation.state] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const resolved = !counts.pending && !counts.orphaned;
  const actionRequired = !resolved;
  const hasVariance = Boolean(counts.variance);
  const filteredRules = rules.filter(rule => {
    const statusOk = statusFilter === 'all'
      || (statusFilter === 'action' ? ['pending', 'orphaned'].includes(rule.reconciliation.state) : rule.reconciliation.state === statusFilter);
    const typeOk = typeFilter === 'all' || rule.item_type === typeFilter;
    return statusOk && typeOk;
  });

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-[var(--fbv4-hairline)] p-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <p className="text-sm font-extrabold" aria-live="polite">
          처리 진행 {rules.length - (counts.pending ?? 0) - (counts.orphaned ?? 0)} / {rules.length}
          <span className="ml-2 text-xs text-[var(--fbv4-muted)]">{actionRequired ? '확인 필요' : '처리 완료'}{hasVariance ? ' · 금액 차이 있음' : ''}</span>
        </p>
        <label className="grid gap-1 text-xs font-bold text-[var(--fbv4-muted)]">상태
          <select value={statusFilter} onChange={event => { setStatusFilter(event.target.value as typeof statusFilter); setVisibleCount(8); }} className="h-10 rounded-xl border border-[var(--fbv4-hairline)] px-3 text-sm text-[var(--fbv4-ink)]">
            <option value="action">미해결/확인필요</option><option value="all">전체</option><option value="pending">미반영</option><option value="variance">차이</option><option value="matched">확인</option><option value="skipped">건너뜀</option><option value="orphaned">연결끊김</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-[var(--fbv4-muted)]">종류
          <select value={typeFilter} onChange={event => { setTypeFilter(event.target.value); setVisibleCount(8); }} className="h-10 rounded-xl border border-[var(--fbv4-hairline)] px-3 text-sm text-[var(--fbv4-ink)]">
            <option value="all">전체</option><option value="수입">수입</option><option value="고정지출">고정지출</option><option value="저축">저축</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {filteredRules.slice(0, visibleCount).map(rule => {
          const done = rule.actualCount > 0 || rule.reconciliation.state === 'skipped' || rule.reconciliation.state === 'orphaned';
          const savingsNeedsPurpose = rule.item_type === '저축' && !rule.purpose_account;
          return (
            <article key={rule.id} className="rounded-2xl border border-[var(--fbv4-hairline)] p-4 shadow-[var(--fbv4-shadow-card)] grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">{rule.name}</p>
                  <p className="text-xs font-bold text-[var(--fbv4-muted)]">{rule.item_type} · {rule.owner_type} · 월 예산 {won(rule.monthly_amount)} · 결제 예정 {won(rule.reconciliation.expectedAmount)}</p>
                  <p className="text-xs font-bold text-[var(--fbv4-muted)]">실제 결제 주기 {billingCycleLabel(rule.billing_cycle)}{rule.billing_months ? ` · 결제월 ${rule.billing_months}` : ''}{rule.reconciliation_mode === 'excluded' ? ' · 계획만' : ''}</p>
                </div>
                <span className="rounded-full bg-[var(--fbv4-subtle)] px-3 py-1 text-xs font-extrabold">{rule.reconciliation.status}</span>
              </div>
              {done ? (
                <div className="grid gap-2 text-sm font-bold text-[var(--fbv4-secondary)]">
                  <p>{rule.reconciliation.state === 'skipped' ? '이번 달은 실제 반영하지 않음' : rule.reconciliation.state === 'orphaned' ? '연결된 실제 기록이 삭제되어 복구가 필요함' : `실제 ${won(rule.reconciliation.actualAmount)} · ${rule.actualCount}건 · 차이 ${rule.reconciliation.difference >= 0 ? '+' : '-'}${won(rule.reconciliation.difference)}`}</p>
                  <button type="button" disabled={busy === rule.id} onClick={() => void submit(rule, 'reopen')} className="justify-self-start text-xs font-bold underline disabled:opacity-40">다시 열기</button>
                </div>
              ) : rule.candidateActuals.length > 0 && !ignoredCandidates.has(rule.id) ? (
                <div className="rounded-xl bg-[var(--fbv4-subtle)] p-3 grid gap-2">
                  <p className="text-sm font-extrabold">기존 원장 후보 {rule.candidateActuals.length}건</p>
                  <p className="text-xs font-bold text-[var(--fbv4-muted)]">새 거래를 만들지 않고 선택한 기존 기록을 이 규칙에 연결합니다.</p>
                  <div className="grid gap-2">
                    {rule.candidateActuals.map(candidate => (
                      <div key={candidate.id} className="grid gap-1">
                        <button type="button" disabled={busy === rule.id} onClick={() => void submit(rule, 'link-existing', candidate)} className="min-h-10 rounded-full bg-[var(--fbv4-accent)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40">기존 원장 연결 · {candidate.date} · {won(candidate.amount)} · 일치 {candidate.matchScore ?? 0}점</button>
                        <p className="px-2 text-xs font-bold text-[var(--fbv4-muted)]">일치 근거: {(candidate.matchReasons || []).map(candidateReasonLabel).join(' · ') || '기본 조건 일치'}</p>
                      </div>
                    ))}
                    <button type="button" onClick={() => setIgnoredCandidates(current => new Set(current).add(rule.id))} className="h-10 rounded-full border border-[var(--fbv4-hairline)] px-4 text-xs font-bold">다른 실제값 입력</button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="grid gap-1 text-xs font-bold text-[var(--fbv4-muted)]">실제 날짜<input type="date" value={dates[rule.id] || ''} onChange={e => setDates(v => ({ ...v, [rule.id]: e.target.value }))} className="h-11 rounded-xl border border-[var(--fbv4-hairline)] px-3 text-sm text-[var(--fbv4-ink)]" /></label>
                  <label className="grid gap-1 text-xs font-bold text-[var(--fbv4-muted)]">실제 금액<input inputMode="numeric" value={amounts[rule.id] || ''} onChange={e => setAmounts(v => ({ ...v, [rule.id]: e.target.value.replace(/[^0-9]/g, '') }))} className="h-11 rounded-xl border border-[var(--fbv4-hairline)] px-3 text-right text-sm text-[var(--fbv4-ink)]" /></label>
                  <button type="button" disabled={busy === rule.id || savingsNeedsPurpose} onClick={() => void submit(rule, 'realize')} className="self-end h-11 rounded-full bg-[var(--fbv4-accent)] px-4 text-sm font-extrabold text-white disabled:opacity-40">실제 반영</button>
                </div>
              )}
              {savingsNeedsPurpose && <p className="text-xs font-bold text-[var(--fbv4-expense)]">저축 규칙에 목적통장을 먼저 지정하세요.</p>}
              {!done && <button type="button" onClick={() => void submit(rule, 'skip')} className="justify-self-start text-xs font-bold text-[var(--fbv4-muted)] underline">이번 달 건너뜀</button>}
            </article>
          );
        })}
      </div>
      {filteredRules.length === 0 && <p className="rounded-2xl border border-dashed border-[var(--fbv4-hairline)] p-6 text-sm font-bold text-[var(--fbv4-muted)]">선택한 조건에 맞는 항목이 없습니다.</p>}
      {visibleCount < filteredRules.length && <button type="button" onClick={() => setVisibleCount(count => count + 8)} className="h-11 rounded-full border border-[var(--fbv4-hairline)] px-5 text-sm font-extrabold">더 보기 · {Math.min(8, filteredRules.length - visibleCount)}건</button>}
      <dialog ref={confirmDialogRef} role="dialog" aria-modal="true" aria-labelledby="link-confirm-title" onCancel={event => { event.preventDefault(); setPendingLink(null); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-[var(--fbv4-canvas)] p-0 shadow-2xl backdrop:bg-black/40">
        {pendingLink && <div className="grid gap-4 p-5">
          <div><p className="text-xs font-bold text-[var(--fbv4-muted)]">기존 원장 연결</p><h2 id="link-confirm-title" className="text-xl font-extrabold">연결 전 최종 확인</h2></div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-[var(--fbv4-subtle)] p-4 text-sm"><dt className="font-bold text-[var(--fbv4-muted)]">대상 규칙</dt><dd className="text-right font-extrabold">{pendingLink.rule.name}</dd><dt className="font-bold text-[var(--fbv4-muted)]">기존 원장</dt><dd className="text-right font-bold">{pendingLink.candidate.entity === 'purpose' ? '목적통장' : '거래원장'}</dd><dt className="font-bold text-[var(--fbv4-muted)]">날짜</dt><dd className="text-right font-bold">{pendingLink.candidate.date}</dd><dt className="font-bold text-[var(--fbv4-muted)]">금액</dt><dd className="text-right font-extrabold">{won(pendingLink.candidate.amount)}</dd><dt className="font-bold text-[var(--fbv4-muted)]">일치</dt><dd className="text-right font-bold">{pendingLink.candidate.matchScore ?? 0}점 · {(pendingLink.candidate.matchReasons || []).map(candidateReasonLabel).join(' · ') || '기본 조건'}</dd></dl>
          <p className="text-xs font-bold text-[var(--fbv4-secondary)]">새 거래를 만들지 않고 이 기존 기록을 규칙의 실제값으로 연결합니다.</p>
          <div className="grid grid-cols-2 gap-2"><button type="button" autoFocus onClick={() => setPendingLink(null)} className="h-11 rounded-full border border-[var(--fbv4-hairline)] text-sm font-bold">취소</button><button type="button" onClick={() => { const pending = pendingLink; setPendingLink(null); void submit(pending.rule, 'link-existing', pending.candidate, true); }} className="h-11 rounded-full bg-[var(--fbv4-accent)] text-sm font-extrabold text-white">연결 진행</button></div>
        </div>}
      </dialog>
      {message && <p role="status" aria-live="polite" className="text-sm font-bold text-[var(--fbv4-secondary)]">{message}</p>}
    </div>
  );
}
