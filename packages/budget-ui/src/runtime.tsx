'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { BudgetUiRuntime } from './contracts';

const BudgetRuntimeContext = createContext<BudgetUiRuntime | null>(null);

export function BudgetRuntimeProvider({ runtime, children }: { runtime: BudgetUiRuntime; children: ReactNode }) {
  return <BudgetRuntimeContext value={runtime}>{children}</BudgetRuntimeContext>;
}

export function useBudgetRuntime(): BudgetUiRuntime {
  const runtime = useContext(BudgetRuntimeContext);
  if (!runtime) throw new Error('BudgetRuntimeProvider is required');
  return runtime;
}
