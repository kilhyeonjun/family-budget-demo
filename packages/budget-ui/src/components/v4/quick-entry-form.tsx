'use client';

import { useEffect, useState } from 'react';
import { buildQuickPayload, type QuickKind } from '@/lib/v4/quick-entry';
import { dateForSelectedMonth } from '@/lib/local-date';
import { apiBridge } from '@/lib/synthetic-budget';

type Settings = { categories?: string[]; purposeAccounts?: string[]; paymentMethods?: string[]; budgetTreatments?: string[] };
type SubmitResult = { ok: boolean; row?: Record<string, unknown>; error?: string };

const fieldClass = 'h-11 w-full min-w-0 rounded-[10px] border border-[var(--fbv4-hairline)] bg-white px-3 text-sm outline-none focus:border-[var(--fbv4-accent)] focus:ring-2 focus:ring-[var(--fbv4-accent)]/30';
const labelClass = 'text-xs font-bold text-[var(--fbv4-muted)] mb-1';

function formattedAmount(value: string) {
  if (!value || value === '-') return value;
  return new Intl.NumberFormat('ko-KR').format(Number(value) || 0);
}

export function QuickEntryForm({ month, owner, settings, onSaved }: {
  month: string; owner: string; settings: Settings; onSaved: (row: Record<string, unknown>) => void;
}) {
  const today = dateForSelectedMonth(month);
  const [kind, setKind] = useState<QuickKind>('expense');
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(settings.categories?.[1] ?? '식비');
  const [treatment, setTreatment] = useState(settings.budgetTreatments?.[0] ?? '예산포함');
  const [payment, setPayment] = useState(settings.paymentMethods?.[0] ?? '체크카드');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDate(previous => dateForSelectedMonth(month, new Date(), previous));
  }, [month]);

  async function submit() {
    if (saving) return;
    const built = buildQuickPayload({
      kind, date, amount, description,
      major_category: category, budget_treatment: treatment, payment_method: payment,
      owner_type: owner === 'all' ? '공동' : owner,
    });
    if (!built.ok) { setError(built.error); return; }
    setSaving(true); setError('');
    try {
      const res = await apiBridge('/api/transactions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(built.payload),
      });
      const body: SubmitResult = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !body.row) throw new Error(body.error || '저장하지 못했어요. 입력은 그대로 있어요.');
      onSaved(body.row);
      setAmount(''); setDescription(''); // 입력 초기화(카테고리·종류는 유지)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); void submit(); }} className="rounded-2xl border border-[var(--fbv4-hairline)] p-4 shadow-[var(--fbv4-shadow-card)] grid gap-3">
      {/* 수입/지출 토글 */}
      <div className="inline-flex rounded-full bg-[var(--fbv4-subtle)] p-1 w-fit">
        {(['expense', 'income'] as QuickKind[]).map(k => (
          <button key={k} type="button" onClick={() => setKind(k)}
            className={`h-11 px-5 rounded-full text-sm font-bold transition-colors ${kind === k ? (k === 'income' ? 'bg-[var(--fbv4-income)] text-white' : 'bg-[var(--fbv4-ink)] text-white') : 'text-[var(--fbv4-secondary)]'}`}>
            {k === 'income' ? '수입' : '지출'}
          </button>
        ))}
      </div>

      {kind === 'income' && (
        <p className="rounded-xl bg-[var(--fbv4-subtle)] px-3 py-2 text-xs font-bold text-[var(--fbv4-secondary)]">
          실제 입금 내역을 거래 원장에 기록합니다. 예상 월급·정기수입은 예상 항목 화면에서 관리하세요.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)_minmax(0,0.9fr)]">
        <label className="grid min-w-0">
          <span className={labelClass}>날짜</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
        </label>
        <label className="grid min-w-0">
          <span className={labelClass}>내용</span>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="예: 점심 김밥" className={fieldClass} />
        </label>
        <label className="grid min-w-0">
          <span className={labelClass}>금액</span>
          <input inputMode="numeric" value={formattedAmount(amount)} onChange={e => setAmount(e.target.value.replace(/[^0-9-]/g, ''))} placeholder="0" className={`${fieldClass} fbv4-num text-right`} />
        </label>
      </div>

      {kind === 'expense' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid min-w-0">
            <span className={labelClass}>분류</span>
            <select value={category} onChange={e => setCategory(e.target.value)} className={fieldClass}>
              {(settings.categories ?? ['식비']).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="grid min-w-0">
            <span className={labelClass}>예산처리</span>
            <select value={treatment} onChange={e => setTreatment(e.target.value)} className={fieldClass}>
              {(settings.budgetTreatments ?? ['예산포함']).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="grid min-w-0">
            <span className={labelClass}>결제수단</span>
            <select value={payment} onChange={e => setPayment(e.target.value)} className={fieldClass}>
              {(settings.paymentMethods ?? ['체크카드']).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      )}

      {error && <p className="text-sm font-bold text-[var(--fbv4-expense)]">{error}</p>}

      <button type="submit" disabled={saving}
        className="h-11 rounded-full bg-[var(--fbv4-accent)] text-white font-bold disabled:opacity-50">
        {saving ? '저장 중…' : '내역 추가'}
      </button>
    </form>
  );
}
