export type QuickKind = 'income' | 'expense';

export type QuickInput = {
  kind: QuickKind;
  date: string;
  amount: string | number;
  description: string;
  major_category?: string;
  minor_category?: string;
  budget_treatment?: string;
  purpose_account?: string;
  payment_method?: string;
  memo?: string;
  owner_type?: string;
};

export type QuickBuildResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string };

export function parseAmount(raw: string | number): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const cleaned = String(raw).replace(/[^0-9.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function monthOf(date: string): string {
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
}

export function buildQuickPayload(input: QuickInput): QuickBuildResult {
  const description = String(input.description ?? '').trim();
  const amount = Math.abs(parseAmount(input.amount)); // 절대값 — 부호는 서버 정규화
  if (!description) return { ok: false, error: '내용을 입력하세요' };
  if (!amount) return { ok: false, error: '금액을 입력하세요' };

  const isIncome = input.kind === 'income';
  const major_category = isIncome ? '수입' : (input.major_category || '식비');
  const budget_treatment = isIncome ? '예산외변동' : (input.budget_treatment || '예산포함');

  return {
    ok: true,
    payload: {
      date: input.date,
      month: monthOf(input.date),
      owner_type: input.owner_type || '공동',
      major_category,
      minor_category: input.minor_category || '기타',
      description,
      budget_treatment,
      purpose_account: input.purpose_account || '',
      payment_method: input.payment_method || '계좌이체',
      amount,
      memo: input.memo || '',
      status: '정상',
    },
  };
}
