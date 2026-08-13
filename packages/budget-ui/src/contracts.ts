import type { ReactNode } from 'react';
import type { EntityKind, EntityOptions } from './lib/v4/entity-config';
import type { DashboardCloseStatus } from './lib/dashboard-close';
import type { MonthlyDecision } from './lib/monthly-decision';

export type Row = Record<string, unknown>;
export type TodaySettings = { categories: string[]; purposeAccounts?: string[]; budgetTreatments: string[]; paymentMethods: string[] };
export type MonthlySummary = {
  expectedIncome: number; actualIncome: number; incomeVariance: number; incomeRealizationRate: number;
  expectedFixedExpenses: number; expectedSavings: number; projectedSpending: number; plannedSurplus: number; expectedSavingsRate: number;
  actualSpending: number; realizedFixedSpending: number; income: number; fixedExpenses: number; savings: number;
  purposeUsage: number; overBudget: number; outsideBudget: number; otherSpending: number; totalSpending: number; surplus: number; savingsRate: number;
};
export type DashboardDto = { summary: MonthlySummary; decision: MonthlyDecision; close: DashboardCloseStatus; categories: { category: string; amount: number }[] };
export type PurposeAccountRow = { account: string; deposits: number; usage: number; balance: number };
export type SettingItem = { id: string | null; label: string; sortOrder: number; editable: boolean; source: string };
export type SettingGroup = { key: string; title: string; writeKind: string; items: SettingItem[] };
export type ReconciliationRow = Record<string, unknown>;

export interface BudgetReadProvider {
  today(month: string, owner: string): Promise<{ settings: TodaySettings; rows: Row[] }>;
  dashboard(month: string, owner: string): Promise<DashboardDto>;
  entity(kind: EntityKind, month: string, owner: string): Promise<{ rows: Row[]; options: EntityOptions }>;
  purpose(month: string): Promise<PurposeAccountRow[]>;
  settings(): Promise<SettingGroup[]>;
  reconciliation(month: string, owner: string): Promise<ReconciliationRow[]>;
}

export interface BudgetCommandAdapter {
  request(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  create(kind: EntityKind, month: string, row: Row): Promise<Row>;
  update(kind: EntityKind, id: string, changed: Row): Promise<Row>;
  remove(kind: EntityKind, id: string): Promise<void>;
  setting(command: 'add' | 'update' | 'remove', payload: Row): Promise<void>;
  reconcile(ruleId: string, payload: Row): Promise<void>;
}

export type BudgetUiRuntime = {
  routeBase: string;
  now(): Date;
  disclosure?: ReactNode;
  reads: BudgetReadProvider;
  commands: BudgetCommandAdapter;
};
