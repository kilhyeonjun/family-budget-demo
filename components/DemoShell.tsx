'use client';

import { Suspense } from 'react';
import { AppShell } from '@penguin-couple/budget-ui/components/v4/app-shell';
import { BudgetRuntimeProvider } from '@penguin-couple/budget-ui/runtime';
import { FIXED_NOW, syntheticCommands, syntheticReads } from '@/lib/synthetic-budget';

export function DemoShell({ children }: { children: React.ReactNode }) {
  return <BudgetRuntimeProvider runtime={{ routeBase: '/', now: () => FIXED_NOW, reads: syntheticReads, commands: syntheticCommands }}><Suspense fallback={<div className="fbv4 min-h-[100dvh] grid place-items-center">불러오는 중…</div>}><AppShell><div className="mb-4 rounded-xl bg-[var(--fbv4-attention-bg)] px-4 py-3 text-sm font-bold text-[var(--fbv4-attention)]">합성 데이터 데모 · 브라우저에만 저장됩니다.</div>{children}</AppShell></Suspense></BudgetRuntimeProvider>;
}
