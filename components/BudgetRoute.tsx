'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TodayClient } from '@penguin-couple/budget-ui/components/v4/today-client';
import { DecisionBadge } from '@penguin-couple/budget-ui/components/v4/decision-badge';
import { KpiRow } from '@penguin-couple/budget-ui/components/v4/kpi-row';
import { CloseChecklist } from '@penguin-couple/budget-ui/components/v4/close-checklist';
import { CategoryRanking } from '@penguin-couple/budget-ui/components/v4/category-ranking';
import { EntityGrid } from '@penguin-couple/budget-ui/components/v4/entity-grid';
import { PurposeSummary } from '@penguin-couple/budget-ui/components/v4/purpose-summary';
import { RecurringReconciliation } from '@penguin-couple/budget-ui/components/v4/recurring-reconciliation';
import { RecurringTabs } from '@penguin-couple/budget-ui/components/v4/recurring-tabs';
import { SettingsManager } from '@penguin-couple/budget-ui/components/v4/settings-manager';
import type { EntityKind } from '@penguin-couple/budget-ui/lib/v4/entity-config';
import type { BudgetReadProvider, DashboardDto, PurposeAccountRow, Row, SettingGroup, TodaySettings } from '@penguin-couple/budget-ui/contracts';
import { useBudgetRuntime } from '@penguin-couple/budget-ui/runtime';

type Route = 'today' | 'dashboard' | 'ledger' | 'purpose' | 'assets' | 'recurring' | 'settings';
type Data = { today?: { settings: TodaySettings; rows: Row[] }; dashboard?: DashboardDto; entity?: Awaited<ReturnType<BudgetReadProvider['entity']>>; purpose?: PurposeAccountRow[]; settings?: SettingGroup[] };
const titles: Record<Route, [string, string]> = { today: ['오늘 입력', '빠르게 기록해요'], dashboard: ['대시보드', '이번 달 판단과 할 일'], ledger: ['거래원장', '이번 달 거래를 표로 관리해요'], purpose: ['목적통장', '통장별 입금과 사용을 확인해요'], assets: ['자산', '이번 달 자산 스냅샷'], recurring: ['예상 항목', '예상 수입·고정지출·저축'], settings: ['설정', '입력 항목을 관리해요'] };
const won = (v: number) => `${v.toLocaleString('ko-KR')}원`;

export function BudgetRoute({ route }: { route: Route }) {
  const { now: clock, reads } = useBudgetRuntime();
  const params = useSearchParams();
  const month = /^\d{4}-\d{2}$/.test(params.get('month') || '') ? params.get('month')! : `${clock().getFullYear()}-${String(clock().getMonth() + 1).padStart(2, '0')}`;
  const owner = ['all', '공동', '현준', '아내'].includes(params.get('owner') || '') ? params.get('owner')! : 'all';
  const [data, setData] = useState<Data>();
  useEffect(() => { let live = true; (async () => { const next: Data = {}; if (route === 'today') next.today = await reads.today(month, owner); if (route === 'dashboard') next.dashboard = await reads.dashboard(month, owner); if (['ledger', 'purpose', 'assets', 'recurring'].includes(route)) next.entity = await reads.entity((route === 'ledger' ? 'transactions' : route) as EntityKind, month, owner); if (route === 'purpose') next.purpose = await reads.purpose(month); if (route === 'settings') next.settings = await reads.settings(); if (live) setData(next); })(); return () => { live = false; }; }, [route, month, owner, reads]);
  if (!data) return <div className="h-72 rounded-2xl bg-[var(--fbv4-subtle)] animate-pulse" aria-label="화면 불러오는 중" />;
  const [eyebrow, heading] = titles[route];
  const rows = data.entity?.rows ?? [];
  const options = data.entity?.options ?? {};
  const recurringSums: Record<string, number> = {};
  for (const row of rows) if (row.status === '진행') { const key = String(row.item_type); recurringSums[key] = Number(recurringSums[key] ?? 0) + Number(row.monthly_amount ?? 0); }
  const household = rows.filter(r => !Number(r.exclude_from_household_assets || 0)).map(r => Number(r.balance || 0)).reduce((n: number, balance: number) => n + balance, 0);
  const excluded = rows.filter(r => Number(r.exclude_from_household_assets || 0)).map(r => Number(r.balance || 0)).reduce((n: number, balance: number) => n + balance, 0);
  return <section className="grid gap-4"><div><p className="text-xs font-bold text-[var(--fbv4-muted)]">{eyebrow}</p><h1 className="text-2xl font-extrabold tracking-tight">{heading}</h1>{route === 'recurring' && <p className="mt-2 text-sm font-medium text-[var(--fbv4-secondary)]">규칙 SSOT로 월별 계획을 한 번만 관리합니다. 한 달짜리 예상은 주기를 ‘한 번’으로 두고, 실제 발생 시 아래에서 날짜·금액만 확인해 연결된 원장으로 반영합니다.</p>}{route === 'settings' && <p className="text-sm text-[var(--fbv4-secondary)] mt-1">거래·자산·예상 항목에서 고를 수 있는 분류·목적통장·결제수단 등을 추가하거나 정리해요.</p>}</div>
    {route === 'today' && data.today && <TodayClient key={`${month}:${owner}`} month={month} owner={owner} settings={data.today.settings} initialRows={data.today.rows as never[]} />}
    {route === 'dashboard' && data.dashboard && <><DecisionBadge decision={data.dashboard.decision} plannedSurplus={data.dashboard.summary.plannedSurplus} /><KpiRow summary={data.dashboard.summary} /><div className="grid gap-4 lg:grid-cols-2 items-start"><CategoryRanking categories={data.dashboard.categories} /><CloseChecklist close={data.dashboard.close} /></div></>}
    {route === 'ledger' && <EntityGrid key={`${month}:${owner}`} kind="transactions" month={month} options={options} initialRows={rows} gridHeight={520} />}
    {route === 'purpose' && <><PurposeSummary rows={data.purpose ?? []} /><div><p className="text-sm font-bold text-[var(--fbv4-secondary)] mb-2">이번 달 입금 기록</p><EntityGrid key={month} kind="purpose" month={month} options={options} initialRows={rows} gridHeight={360} /></div></>}
    {route === 'assets' && <><div className="grid gap-3 sm:grid-cols-2"><Summary label="가계 순자산" value={household} /><Summary label="가계 합계 제외" value={excluded} muted /></div><div><p className="text-sm font-bold text-[var(--fbv4-secondary)] mb-2">{month} 자산 목록</p><EntityGrid key={`${month}:${owner}`} kind="assets" month={month} options={options} initialRows={rows} gridHeight={420} /></div></>}
    {route === 'recurring' && <><div className="grid gap-3 sm:grid-cols-3"><Summary label="월 예상 수입" value={recurringSums.수입 || 0} /><Summary label="월 고정 지출" value={recurringSums.고정지출 || 0} /><Summary label="월 저축" value={recurringSums.저축 || 0} /></div><RecurringTabs check={<div><p className="text-sm font-extrabold mb-2">{month} 실제 반영 상태</p><RecurringReconciliation month={month} owner={owner} /></div>} rules={<div><p className="text-sm font-bold text-[var(--fbv4-secondary)] mb-2">규칙 관리</p><p className="mb-2 text-xs font-bold text-[var(--fbv4-muted)]">데스크톱 표는 가로로 스크롤할 수 있습니다. 이름과 금액 열을 먼저 확인하세요.</p><EntityGrid key={`${month}:${owner}`} kind="recurring" month={month} options={options} initialRows={rows} gridHeight={420} /></div>} /></>}
    {route === 'settings' && data.settings && <SettingsManager groups={data.settings} />}
  </section>;
}
function Summary({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) { return <div className="rounded-2xl border border-[var(--fbv4-hairline)] p-5 shadow-[var(--fbv4-shadow-card)]"><p className="text-xs font-bold text-[var(--fbv4-muted)]">{label}</p><p className={`text-2xl font-extrabold fbv4-num mt-1 ${muted ? 'text-[var(--fbv4-secondary)]' : ''}`}>{won(value)}</p></div>; }
