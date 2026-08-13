export type BudgetTreatment = '목적통장차감' | '예산초과추가' | '예산외변동' | '예산포함';

const TREATMENT_ALIASES: Record<string, BudgetTreatment> = {
  '목적통장차감': '목적통장차감',
  '목적통장': '목적통장차감',
  '예산초과추가': '예산초과추가',
  '예산외변동': '예산외변동',
  '예산외': '예산외변동',
  '개인용돈': '예산외변동',
  '이체제외': '예산외변동',
  '예산포함': '예산포함',
};

export function normalizeBudgetTreatment(raw: string | null | undefined): BudgetTreatment {
  return TREATMENT_ALIASES[String(raw ?? '')] ?? '예산포함';
}

export type TxRow = {
  major_category?: string | null;
  budget_treatment?: string | null;
  amount?: number | null;
  recurring_occurrence_id?: string | null;
};

export type TxBucket = 'income' | 'purposeSpending' | 'overBudget' | 'outsideBudget' | 'otherSpending';

export function classifyTransaction(row: TxRow): TxBucket {
  if (row.major_category === '수입') return 'income';
  const treatment = normalizeBudgetTreatment(row.budget_treatment);
  if (treatment === '목적통장차감') return 'purposeSpending';
  if (treatment === '예산초과추가') return 'overBudget';
  if (treatment === '예산외변동') return 'outsideBudget';
  return 'otherSpending';
}

export type TxTotals = {
  income: number;
  purposeSpending: number;
  overBudget: number;
  outsideBudget: number;
  otherSpending: number;
  recurringFixedSpending: number;
  totalSpending: number;
};

export function sumTransactions(rows: TxRow[]): TxTotals {
  const totals: TxTotals = { income: 0, purposeSpending: 0, overBudget: 0, outsideBudget: 0, otherSpending: 0, recurringFixedSpending: 0, totalSpending: 0 };
  for (const row of rows) {
    const amount = Number(row.amount ?? 0);
    const bucket = classifyTransaction(row);
    if (bucket === 'income') { totals.income += amount; continue; }
    const abs = Math.abs(amount);
    if (row.recurring_occurrence_id) totals.recurringFixedSpending += abs;
    else totals[bucket] += abs;
    totals.totalSpending += abs;
  }
  return totals;
}
