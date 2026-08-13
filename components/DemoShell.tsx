import { Suspense } from 'react';
import { AppShell } from '@/packages/budget-ui/src/components/v4/app-shell';

export function DemoShell({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="fbv4 min-h-[100dvh] grid place-items-center">불러오는 중…</div>}><AppShell><div className="mb-4 rounded-xl bg-[var(--fbv4-attention-bg)] px-4 py-3 text-sm font-bold text-[var(--fbv4-attention)]">합성 데이터 데모 · 브라우저에만 저장됩니다.</div>{children}</AppShell></Suspense>;
}
