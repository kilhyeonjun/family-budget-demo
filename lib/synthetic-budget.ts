import type { BudgetCommandAdapter, BudgetReadProvider, DashboardDto, PurposeAccountRow, Row, SettingGroup } from '@/packages/budget-ui/src/contracts';
import type { EntityKind, EntityOptions } from '@/packages/budget-ui/src/lib/v4/entity-config';
import { sumTransactions } from '@/packages/budget-ui/src/lib/aggregate';
import { deriveDashboardCloseStatus } from '@/packages/budget-ui/src/lib/dashboard-close';
import { deriveMonthlyDecision } from '@/packages/budget-ui/src/lib/monthly-decision';

const KEY = 'family-budget-demo:v4';
export const FIXED_NOW = new Date('2026-08-13T12:00:00+09:00');

type State = { entities: Record<EntityKind, Row[]>; settings: SettingGroup[] };
const groups = (key: string, title: string, labels: string[]): SettingGroup => ({ key, title, writeKind: key, items: labels.map((label, i) => ({ id: null, label, sortOrder: i, editable: false, source: 'default' })) });
const seed: State = {
  entities: {
    transactions: [
      { id: 'tx-1', month: '2026-08', date: '2026-08-13', owner_type: '공동', major_category: '식비', minor_category: '외식', description: '저녁 식사', amount: -42000, budget_treatment: '예산포함', purpose_account: '', payment_method: '체크카드', memo: '', status: '정상' },
      { id: 'tx-2', month: '2026-08', date: '2026-08-10', owner_type: '현준', major_category: '수입', minor_category: '급여', description: '급여', amount: 4200000, budget_treatment: '예산포함', purpose_account: '', payment_method: '계좌이체', memo: '', status: '정상' },
      { id: 'tx-3', month: '2026-08', date: '2026-08-08', owner_type: '공동', major_category: '여행', minor_category: '숙박', description: '여행 숙소', amount: -280000, budget_treatment: '목적통장차감', purpose_account: '여행', payment_method: '신용카드', memo: '', status: '정상' }
    ],
    purpose: [{ id: 'purpose-1', month: '2026-08', date: '2026-08-05', purpose_account: '여행', deposit_type: '정기입금', amount: 500000, memo: '' }],
    assets: [
      { id: 'asset-1', month: '2026-08', owner_type: '공동', asset_type: '입출금', account_name: '생활비 통장', balance: 2300000, exclude_from_household_assets: 0, memo: '' },
      { id: 'asset-2', month: '2026-08', owner_type: '현준', asset_type: '저축', account_name: '개인 비상금', balance: 1800000, exclude_from_household_assets: 1, memo: '' }
    ],
    recurring: [
      { id: 'rule-1', item_type: '수입', cadence: 'monthly', billing_cycle: 'monthly', billing_months: '', name: '급여', owner_type: '현준', major_category: '수입', minor_category: '급여', monthly_amount: 4200000, expected_charge_amount: 4200000, expected_day: 10, payment_method: '계좌이체', budget_treatment: '예산포함', purpose_account: '', deposit_type: '', start_month: '2026-01', end_month: '', status: '진행', reconciliation_mode: 'tracked', reconciliation_note: '' },
      { id: 'rule-2', item_type: '고정지출', cadence: 'monthly', billing_cycle: 'monthly', billing_months: '', name: '주거비', owner_type: '공동', major_category: '주거', minor_category: '월세', monthly_amount: 1200000, expected_charge_amount: 1200000, expected_day: 1, payment_method: '자동이체', budget_treatment: '예산포함', purpose_account: '', deposit_type: '', start_month: '2026-01', end_month: '', status: '진행', reconciliation_mode: 'tracked', reconciliation_note: '' },
      { id: 'rule-3', item_type: '저축', cadence: 'monthly', billing_cycle: 'monthly', billing_months: '', name: '여행 저축', owner_type: '공동', major_category: '저축', minor_category: '여행', monthly_amount: 500000, expected_charge_amount: 500000, expected_day: 5, payment_method: '자동이체', budget_treatment: '예산포함', purpose_account: '여행', deposit_type: '정기입금', start_month: '2026-01', end_month: '', status: '진행', reconciliation_mode: 'tracked', reconciliation_note: '' }
    ]
  },
  settings: [groups('owners', '부담 주체', ['공동', '현준', '아내']), groups('categories', '대분류', ['수입', '식비', '주거', '교통', '여행', '저축', '기타']), groups('subcategories', '소분류', ['기타', '외식', '급여', '숙박', '월세', '여행']), groups('purposeAccounts', '목적통장', ['여행', '비상금']), groups('paymentMethods', '결제수단', ['체크카드', '신용카드', '현금', '계좌이체', '자동이체']), groups('budgetTreatments', '예산처리', ['예산포함', '목적통장차감', '예산초과추가', '예산외변동']), groups('statuses', '상태', ['정상', '확인 필요']), groups('assetTypes', '자산종류', ['입출금', '저축', '투자']), groups('depositTypes', '입금종류', ['정기입금', '추가입금']), groups('recurringTypes', '예상 종류', ['수입', '고정지출', '저축']), groups('cadences', '예상 생성 주기', ['monthly', 'one-time']), groups('billingCycles', '실제 결제 주기', ['monthly', 'quarterly', 'annual']), groups('reconciliationModes', '확인 방식', ['tracked', 'excluded'])]
};
let memory: State | null = null;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
function load(): State {
  if (typeof localStorage === 'undefined') return memory ??= clone(seed);
  try { return JSON.parse(localStorage.getItem(KEY) || '') as State; } catch { const value = clone(seed); localStorage.setItem(KEY, JSON.stringify(value)); return value; }
}
function save(state: State) { memory = state; if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(state)); }
export function resetSyntheticBudget() { memory = clone(seed); if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY); }
const options = (state: State): EntityOptions => Object.fromEntries(state.settings.map(group => [group.key, group.items.map(item => item.label)]));
const visible = (rows: Row[], month: string, owner: string) => rows.filter(row => (!row.month || row.month === month) && (owner === 'all' || row.owner_type === owner));

export const syntheticReads: BudgetReadProvider = {
  async today(month, owner) { const state = load(); const o = options(state); return { settings: { categories: o.categories, purposeAccounts: o.purposeAccounts, budgetTreatments: o.budgetTreatments, paymentMethods: o.paymentMethods }, rows: visible(state.entities.transactions, month, owner).slice(0, 10) }; },
  async entity(kind, month, owner) { const state = load(); return { rows: visible(state.entities[kind], month, owner), options: options(state) }; },
  async purpose(month) { const state = load(); const deposits = visible(state.entities.purpose, month, 'all'); const tx = visible(state.entities.transactions, month, 'all'); const names = options(state).purposeAccounts; return names.map(account => { const d = deposits.filter(r => r.purpose_account === account).reduce((n, r) => n + Number(r.amount || 0), 0); const u = tx.filter(r => r.purpose_account === account && r.budget_treatment === '목적통장차감').reduce((n, r) => n + Math.abs(Number(r.amount || 0)), 0); return { account, deposits: d, usage: u, balance: d - u }; }) as PurposeAccountRow[]; },
  async settings() { return clone(load().settings); },
  async reconciliation(month, owner) { return visible(load().entities.recurring, month, owner).map(rule => ({ ...rule, occurrenceId: '', actualId: '', actualDate: '', actualIds: [], actualCount: 0, candidateActual: null, candidateActuals: [], candidateCount: 0, reconciliation: { state: 'pending', status: '미반영', expectedAmount: Number(rule.expected_charge_amount || rule.monthly_amount || 0), actualAmount: 0, difference: 0 } })); },
  async dashboard(month, owner): Promise<DashboardDto> {
    const state = load(); const tx = visible(state.entities.transactions, month, owner); const recurring = visible(state.entities.recurring, month, owner).filter(r => r.status === '진행'); const totals = sumTransactions(tx);
    const expectedIncome = recurring.filter(r => r.item_type === '수입').reduce((n, r) => n + Number(r.monthly_amount || 0), 0); const expectedFixedExpenses = recurring.filter(r => r.item_type === '고정지출').reduce((n, r) => n + Number(r.monthly_amount || 0), 0); const expectedSavings = recurring.filter(r => r.item_type === '저축').reduce((n, r) => n + Number(r.monthly_amount || 0), 0); const projectedSpending = expectedFixedExpenses + totals.purposeSpending + totals.overBudget + totals.outsideBudget + totals.otherSpending; const plannedSurplus = expectedIncome - projectedSpending - expectedSavings;
    const summary = { expectedIncome, actualIncome: totals.income, incomeVariance: totals.income - expectedIncome, incomeRealizationRate: expectedIncome ? totals.income / expectedIncome : 0, expectedFixedExpenses, expectedSavings, projectedSpending, plannedSurplus, expectedSavingsRate: expectedIncome ? expectedSavings / expectedIncome : 0, actualSpending: totals.totalSpending, realizedFixedSpending: totals.recurringFixedSpending, income: expectedIncome, fixedExpenses: expectedFixedExpenses, savings: expectedSavings, purposeUsage: totals.purposeSpending, overBudget: totals.overBudget, outsideBudget: totals.outsideBudget, otherSpending: totals.otherSpending, totalSpending: projectedSpending, surplus: plannedSurplus, savingsRate: expectedIncome ? expectedSavings / expectedIncome : 0 };
    const close = deriveDashboardCloseStatus({ needCheckCount: 0, purposeInputCount: state.entities.purpose.length, assetInputCount: state.entities.assets.length }); const decision = deriveMonthlyDecision({ surplus: plannedSurplus, purposeRisks: [], needCheckCount: 0, closeReady: close.close === '마감 가능' }); const categories = tx.filter(r => r.major_category !== '수입').reduce((m, r) => m.set(String(r.major_category), (m.get(String(r.major_category)) || 0) + Math.abs(Number(r.amount || 0))), new Map<string, number>());
    return { summary, close, decision, categories: [...categories].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount) };
  }
};

export const syntheticCommands: BudgetCommandAdapter = {
  async create(kind, month, row) { const state = load(); const created = { ...row, id: `${kind}-${Date.now()}`, month }; state.entities[kind].unshift(created); save(state); return clone(created); },
  async update(kind, id, changed) { const state = load(); const index = state.entities[kind].findIndex(row => row.id === id); if (index < 0) throw new Error('항목을 찾지 못했어요.'); state.entities[kind][index] = { ...state.entities[kind][index], ...changed }; save(state); return clone(state.entities[kind][index]); },
  async remove(kind, id) { const state = load(); state.entities[kind] = state.entities[kind].filter(row => row.id !== id); save(state); },
  async setting(command, payload) { const state = load(); const group = state.settings.find(item => item.key === payload.groupKey); if (!group) throw new Error('설정 그룹을 찾지 못했어요.'); if (command === 'add') group.items.push({ id: `setting-${Date.now()}`, label: String(payload.label), sortOrder: group.items.length, editable: true, source: 'demo' }); else if (command === 'update') { const item = group.items.find(i => i.id === payload.id); if (item) item.label = String(payload.label); } else group.items = group.items.filter(i => i.id !== payload.id); save(state); },
  async reconcile() { /* synthetic demo keeps reconciliation local-only and deterministic */ }
};

export async function apiBridge(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = new URL(String(input), 'http://demo.local'); const method = init.method || 'GET'; const body = init.body ? JSON.parse(String(init.body)) : {};
  try {
    if (url.pathname === '/api/settings') { if (method === 'GET') return Response.json({ settingGroups: await syntheticReads.settings() }); await syntheticCommands.setting(method === 'POST' ? 'add' : method === 'PUT' ? 'update' : 'remove', { ...body, id: body.id || url.searchParams.get('id') }); return Response.json({ ok: true }); }
    if (url.pathname === '/api/recurring/reconciliation') return Response.json({ rows: await syntheticReads.reconciliation(url.searchParams.get('month') || '2026-08', url.searchParams.get('owner') || 'all') });
    const realize = url.pathname.match(/^\/api\/recurring\/([^/]+)\/realize$/); if (realize) { await syntheticCommands.reconcile(realize[1], body); return Response.json({ ok: true }); }
    const match = url.pathname.match(/^\/api\/(transactions|purpose|assets|recurring)(?:\/([^/]+))?$/); if (!match) return Response.json({ error: '지원하지 않는 데모 명령' }, { status: 404 }); const kind = match[1] as EntityKind; const id = match[2]; if (method === 'DELETE' && id) { await syntheticCommands.remove(kind, id); return Response.json({ ok: true }); } if (method === 'PUT' && id) return Response.json({ row: await syntheticCommands.update(kind, id, body) }); return Response.json({ row: await syntheticCommands.create(kind, url.searchParams.get('month') || String(body.month || '2026-08'), body) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : '데모 저장 실패' }, { status: 400 }); }
}
