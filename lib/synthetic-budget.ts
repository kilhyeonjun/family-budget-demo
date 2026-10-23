import type { BudgetCommandAdapter, BudgetReadProvider, DashboardDto, PurposeAccountRow, Row, SettingGroup } from '@penguin-couple/budget-ui/contracts';
import type { EntityKind, EntityOptions } from '@penguin-couple/budget-ui/lib/v4/entity-config';
import { sumTransactions } from '@penguin-couple/budget-ui/lib/aggregate';
import { deriveDashboardCloseStatus } from '@penguin-couple/budget-ui/lib/dashboard-close';
import { deriveMonthlyDecision } from '@penguin-couple/budget-ui/lib/monthly-decision';

const KEY = 'family-budget-demo:v4';
export const FIXED_NOW = new Date('2026-08-13T12:00:00+09:00');

type ActualEntity = 'transactions' | 'purpose';
type Occurrence = { ruleId: string; month: string; state: 'linked' | 'skipped'; actualEntity?: ActualEntity; actualId?: string; realization?: { date: string; amount: number } };
type State = { entities: Record<EntityKind, Row[]>; settings: SettingGroup[]; occurrences?: Record<string, Occurrence> };
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
  try { return JSON.parse(localStorage.getItem(KEY) || '') as State; } catch { return clone(seed); }
}
function save(state: State) { memory = state; if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(state)); }
export function resetSyntheticBudget() { memory = clone(seed); if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY); }
const options = (state: State): EntityOptions => Object.fromEntries(state.settings.map(group => [group.key, group.items.map(item => item.label)]));
const visible = (rows: Row[], month: string, owner: string) => rows.filter(row => (row.month === month || (!row.month && String(row.date || '').slice(0, 7) === month)) && (owner === 'all' || row.owner_type === owner));

// Planning recurs monthly; actual reconciliation follows the billing schedule.
function activeRule(rule: Row, month: string) {
  return rule.status === '진행' && (!rule.start_month || String(rule.start_month) <= month)
    && (!rule.end_month || String(rule.end_month) >= month)
    && (rule.cadence !== 'one-time' || rule.start_month === month);
}
function dueRule(rule: Row, month: string) {
  if (!activeRule(rule, month) || rule.reconciliation_mode === 'excluded') return false;
  const billingMonths = String(rule.billing_months || '').split(/[,\s]+/).filter(Boolean).map(Number);
  const current = Number(month.slice(5));
  if (billingMonths.length) return billingMonths.includes(current);
  const interval = rule.billing_cycle === 'annual' ? 12 : rule.billing_cycle === 'quarterly' ? 3 : 1;
  const start = String(rule.start_month || month);
  const distance = (Number(month.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + current - Number(start.slice(5));
  return distance % interval === 0;
}
function matchingActual(rule: Row, row: Row, entity: ActualEntity, month: string) {
  if (row.month !== month || String(row.date || '').slice(0, 7) !== month) return false;
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) return false;
  if (rule.item_type === '저축') return entity === 'purpose' && amount > 0 && !!rule.purpose_account
    && row.purpose_account === rule.purpose_account && (!rule.deposit_type || row.deposit_type === rule.deposit_type);
  return entity === 'transactions' && (rule.item_type === '수입' ? amount > 0 && row.major_category === '수입' : amount < 0 && row.major_category !== '수입')
    && row.owner_type === rule.owner_type && row.major_category === rule.major_category
    && (!rule.minor_category || row.minor_category === rule.minor_category)
    && String(row.purpose_account || '') === String(rule.purpose_account || '')
    && (!rule.budget_treatment || row.budget_treatment === rule.budget_treatment);
}
function reconciliationRows(state: State, month: string, owner: string) {
  const occurrences = state.occurrences || {};
  return state.entities.recurring.filter(rule => dueRule(rule, month) && (owner === 'all' || rule.owner_type === owner)).map(rule => {
    const key = `${rule.id}:${month}`;
    const occurrence = occurrences[key];
    const entity: ActualEntity = rule.item_type === '저축' ? 'purpose' : 'transactions';
    const actual = occurrence?.state === 'linked' && occurrence.actualEntity === entity
      ? state.entities[entity].find(row => row.id === occurrence.actualId && matchingActual(rule, row, entity, month)) : undefined;
    const expectedAmount = Number(rule.expected_charge_amount ?? rule.monthly_amount ?? 0);
    const actualAmount = actual ? Math.abs(Number(actual.amount)) : 0;
    const difference = actual ? actualAmount - expectedAmount : 0;
    const reconciliationState = occurrence?.state === 'skipped' ? 'skipped' : occurrence?.state === 'linked'
      ? !actual ? 'orphaned' : difference === 0 ? 'matched' : 'variance' : 'pending';
    const candidates = state.entities[entity].filter(row => matchingActual(rule, row, entity, month)
      && !Object.values(occurrences).some(item => item.state === 'linked' && item.actualEntity === entity && item.actualId === row.id))
      .map(row => {
        const matchReasons = [entity === 'purpose' ? 'purpose' : 'owner', 'category'];
        if (Math.abs(Number(row.amount)) === expectedAmount) matchReasons.push('amount');
        if (row.description === rule.name) matchReasons.push('name');
        if (row.payment_method && row.payment_method === rule.payment_method) matchReasons.push('payment');
        if (Number(String(row.date).slice(8)) === Number(rule.expected_day)) matchReasons.push('date');
        return { id: String(row.id), entity, date: String(row.date), amount: Math.abs(Number(row.amount)), matchScore: matchReasons.length, matchReasons };
      }).sort((a, b) => b.matchScore - a.matchScore || a.id.localeCompare(b.id));
    return { ...rule, item_type: rule.item_type, occurrenceId: occurrence ? key : '', actualId: actual ? String(actual.id) : '', actualDate: actual ? String(actual.date) : '', actualIds: actual ? [String(actual.id)] : [], actualCount: actual ? 1 : 0,
      candidateActual: candidates[0] || null, candidateActuals: candidates, candidateCount: candidates.length,
      reconciliation: { state: reconciliationState, status: ({ pending: '미반영', matched: '확인', variance: '차이', skipped: '건너뜀', orphaned: '연결끊김' })[reconciliationState], expectedAmount, actualAmount, difference } };
  });
}

export const syntheticReads: BudgetReadProvider = {
  async today(month, owner) { const state = load(); const o = options(state); return { settings: { categories: o.categories, purposeAccounts: o.purposeAccounts, budgetTreatments: o.budgetTreatments, paymentMethods: o.paymentMethods }, rows: visible(state.entities.transactions, month, owner).slice(0, 10) }; },
  async entity(kind, month, owner) { const state = load(); return { rows: clone(kind === 'recurring' ? state.entities.recurring.filter(row => owner === 'all' || row.owner_type === owner) : visible(state.entities[kind], month, owner)), options: options(state) }; },
  async purpose(month) { const state = load(); const deposits = visible(state.entities.purpose, month, 'all'); const tx = visible(state.entities.transactions, month, 'all'); const names = [...new Set([...options(state).purposeAccounts, ...deposits.map(row => String(row.purpose_account || '')), ...tx.filter(row => row.budget_treatment === '목적통장차감').map(row => String(row.purpose_account || ''))])].filter(Boolean); return names.map(account => { const d = deposits.filter(r => r.purpose_account === account).reduce((n, r) => n + Number(r.amount || 0), 0); const u = tx.filter(r => r.purpose_account === account && r.budget_treatment === '목적통장차감').reduce((n, r) => n + Math.abs(Number(r.amount || 0)), 0); return { account, deposits: d, usage: u, balance: d - u }; }) as PurposeAccountRow[]; },
  async settings() { return clone(load().settings); },
  async reconciliation(month, owner) { return clone(reconciliationRows(load(), month, owner)); },
  async dashboard(month, owner): Promise<DashboardDto> {
    const state = load(); const tx = visible(state.entities.transactions, month, owner); const recurring = state.entities.recurring.filter(r => activeRule(r, month) && (owner === 'all' || r.owner_type === owner));
    const reconciliation = reconciliationRows(state, month, owner);
    const fixedActualIds = new Set(reconciliation.filter(row => row.item_type === '고정지출' && row.actualCount > 0).map(row => row.actualId));
    const totals = sumTransactions(tx.map(row => ({ ...row, recurring_occurrence_id: fixedActualIds.has(String(row.id)) ? String(row.id) : null })));
    const expectedIncome = recurring.filter(r => r.item_type === '수입').reduce((n, r) => n + Number(r.monthly_amount || 0), 0); const expectedFixedExpenses = recurring.filter(r => r.item_type === '고정지출').reduce((n, r) => n + Number(r.monthly_amount || 0), 0); const expectedSavings = recurring.filter(r => r.item_type === '저축').reduce((n, r) => n + Number(r.monthly_amount || 0), 0); const projectedSpending = expectedFixedExpenses + totals.purposeSpending + totals.overBudget + totals.outsideBudget + totals.otherSpending; const plannedSurplus = expectedIncome - projectedSpending - expectedSavings;
    const summary = { expectedIncome, actualIncome: totals.income, incomeVariance: totals.income - expectedIncome, incomeRealizationRate: expectedIncome ? totals.income / expectedIncome : 0, expectedFixedExpenses, expectedSavings, projectedSpending, plannedSurplus, expectedSavingsRate: expectedIncome ? expectedSavings / expectedIncome : 0, actualSpending: totals.totalSpending, realizedFixedSpending: totals.recurringFixedSpending, income: expectedIncome, fixedExpenses: expectedFixedExpenses, savings: expectedSavings, purposeUsage: totals.purposeSpending, overBudget: totals.overBudget, outsideBudget: totals.outsideBudget, otherSpending: totals.otherSpending, totalSpending: projectedSpending, surplus: plannedSurplus, savingsRate: expectedIncome ? expectedSavings / expectedIncome : 0 };
    const purposeRisks = (await syntheticReads.purpose(month)).filter(row => row.balance < 0);
    const unresolvedCount = reconciliation.filter(row => ['pending', 'orphaned'].includes(row.reconciliation.state)).length;
    const needCheckCount = unresolvedCount + tx.filter(row => row.status === '확인 필요').length;
    const close = deriveDashboardCloseStatus({ needCheckCount: needCheckCount + purposeRisks.length, purposeInputCount: visible(state.entities.purpose, month, 'all').length, assetInputCount: visible(state.entities.assets, month, owner).length }); const decision = deriveMonthlyDecision({ surplus: plannedSurplus, purposeRisks, needCheckCount, closeReady: close.close === '마감 가능' }); const categories = tx.filter(r => r.major_category !== '수입').reduce((m, r) => m.set(String(r.major_category), (m.get(String(r.major_category)) || 0) + Math.abs(Number(r.amount || 0))), new Map<string, number>());
    return { summary, close, decision, categories: [...categories].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount) };
  }
};

export const syntheticCommands: BudgetCommandAdapter = {
  request: apiBridge,
  async create(kind, month, row) { const state = load(); const created = { ...row, id: `${kind}-${crypto.randomUUID()}`, month }; state.entities[kind].unshift(created); save(state); return clone(created); },
  async update(kind, id, changed) { const state = load(); const index = state.entities[kind].findIndex(row => row.id === id); if (index < 0) throw new Error('항목을 찾지 못했어요.'); state.entities[kind][index] = { ...state.entities[kind][index], ...changed, id }; save(state); return clone(state.entities[kind][index]); },
  async remove(kind, id) { const state = load(); state.entities[kind] = state.entities[kind].filter(row => row.id !== id); save(state); },
  async setting(command, payload) { const state = load(); const group = state.settings.find(item => item.key === payload.groupKey); if (!group) throw new Error('설정 그룹을 찾지 못했어요.'); if (command === 'add') group.items.push({ id: `setting-${crypto.randomUUID()}`, label: String(payload.label), sortOrder: group.items.length, editable: true, source: 'demo' }); else if (command === 'update') { const item = group.items.find(i => i.id === payload.id); if (item) item.label = String(payload.label); } else group.items = group.items.filter(i => i.id !== payload.id); save(state); },
  async reconcile(ruleId, payload) {
    const state = clone(load());
    const month = String(payload.month || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('유효한 월이 필요해요.');
    const rule = state.entities.recurring.find(row => row.id === ruleId);
    if (!rule || !dueRule(rule, month)) throw new Error('이번 달에 확인할 규칙이 아니에요.');
    const key = `${ruleId}:${month}`;
    const occurrence = state.occurrences?.[key];
    const action = payload.action;
    if (!['realize', 'link-existing', 'skip', 'reopen'].includes(String(action))) throw new Error('지원하지 않는 확인 명령이에요.');
    if (action === 'reopen') {
      if (state.occurrences) delete state.occurrences[key];
      save(state);
      return;
    }
    if (action === 'skip') {
      if (occurrence?.state === 'skipped') return;
      if (occurrence) throw new Error('먼저 다시 열어 주세요.');
      state.occurrences ??= {};
      state.occurrences[key] = { ruleId, month, state: 'skipped' };
      save(state);
      return;
    }
    const entity: ActualEntity = rule.item_type === '저축' ? 'purpose' : 'transactions';
    let actual: Row | undefined;
    let realization: Occurrence['realization'];
    if (action === 'link-existing') {
      if (payload.actualEntity !== entity) throw new Error('규칙과 원장 종류가 맞지 않아요.');
      actual = state.entities[entity].find(row => row.id === payload.actualId);
      if (!actual || !matchingActual(rule, actual, entity, month)) throw new Error('연결할 실제 기록이 규칙과 맞지 않아요.');
    } else {
      const date = String(payload.date || '');
      const amount = Number(payload.actualAmount);
      const day = Number(date.slice(8));
      const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.slice(0, 7) !== month || day < 1 || day > lastDay || !Number.isFinite(amount) || amount <= 0) throw new Error('이번 달 날짜와 양수 실제 금액을 입력해 주세요.');
      realization = { date, amount };
      if (occurrence?.state === 'linked' && occurrence.realization?.date === date && occurrence.realization.amount === amount) {
        const existing = state.entities[entity].find(row => row.id === occurrence.actualId);
        if (occurrence.actualEntity === entity && existing && matchingActual(rule, existing, entity, month) && existing.date === date && Math.abs(Number(existing.amount)) === amount) return;
      }
      actual = entity === 'purpose'
        ? { id: `purpose-${crypto.randomUUID()}`, month, date, purpose_account: rule.purpose_account, deposit_type: rule.deposit_type || '정기입금', amount, memo: '' }
        : { id: `transactions-${crypto.randomUUID()}`, month, date, owner_type: rule.owner_type, major_category: rule.major_category, minor_category: rule.minor_category, description: rule.name,
          amount: rule.item_type === '수입' ? amount : -amount, budget_treatment: rule.budget_treatment || '예산포함', purpose_account: rule.purpose_account || '', payment_method: rule.payment_method || '', memo: '', status: '정상' };
      if (!matchingActual(rule, actual, entity, month)) throw new Error('규칙의 실제 기록 정보를 확인해 주세요.');
    }
    if (occurrence) {
      if (action === 'link-existing' && occurrence.state === 'linked' && occurrence.actualEntity === entity && occurrence.actualId === actual.id) return;
      throw new Error('이미 처리된 항목이에요. 먼저 다시 열어 주세요.');
    }
    if (Object.values(state.occurrences || {}).some(item => item.state === 'linked' && item.actualEntity === entity && item.actualId === actual.id)) throw new Error('다른 규칙에 연결된 기록이에요.');
    if (action === 'realize') state.entities[entity].unshift(actual);
    state.occurrences ??= {};
    state.occurrences[key] = { ruleId, month, state: 'linked', actualEntity: entity, actualId: String(actual.id), ...(realization ? { realization } : {}) };
    save(state);
  }
};

export async function apiBridge(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  try {
    const request = typeof Request !== 'undefined' && input instanceof Request ? input : null;
    const url = new URL(request ? request.url : String(input), 'http://demo.local');
    const method = (init.method || request?.method || 'GET').toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : request && !['GET', 'HEAD'].includes(method) ? await request.json() : {};
    const month = url.searchParams.get('month') || String(body.month || '2026-08');
    const owner = url.searchParams.get('owner') || 'all';
    const methodError = () => Response.json({ error: '지원하지 않는 데모 메서드' }, { status: 405 });
    if (url.pathname === '/api/settings') {
      if (method === 'GET') return Response.json({ settingGroups: await syntheticReads.settings() });
      if (!['POST', 'PUT', 'DELETE'].includes(method)) return methodError();
      await syntheticCommands.setting(method === 'POST' ? 'add' : method === 'PUT' ? 'update' : 'remove', { ...body, id: body.id || url.searchParams.get('id') });
      return Response.json({ ok: true });
    }
    if (url.pathname === '/api/recurring/reconciliation') return method === 'GET'
      ? Response.json({ rows: await syntheticReads.reconciliation(month, owner) }) : methodError();
    const realize = url.pathname.match(/^\/api\/recurring\/([^/]+)\/realize$/);
    if (realize) {
      if (method !== 'POST') return methodError();
      await syntheticCommands.reconcile(decodeURIComponent(realize[1]), body);
      return Response.json({ ok: true });
    }
    const match = url.pathname.match(/^\/api\/(transactions|purpose|assets|recurring)(?:\/([^/]+))?$/);
    if (!match) return Response.json({ error: '지원하지 않는 데모 명령' }, { status: 404 });
    const kind = match[1] as EntityKind;
    const id = match[2] ? decodeURIComponent(match[2]) : '';
    if (method === 'GET') {
      const result = await syntheticReads.entity(kind, month, owner);
      if (!id) return Response.json(result);
      const row = result.rows.find(item => item.id === id);
      return row ? Response.json({ row }) : Response.json({ error: '항목을 찾지 못했어요.' }, { status: 404 });
    }
    if (method === 'DELETE' && id) { await syntheticCommands.remove(kind, id); return Response.json({ ok: true }); }
    if (method === 'PUT' && id) return Response.json({ row: await syntheticCommands.update(kind, id, body) });
    if (method === 'POST' && !id) return Response.json({ row: await syntheticCommands.create(kind, month, body) });
    return methodError();
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : '데모 저장 실패' }, { status: 400 }); }
}
