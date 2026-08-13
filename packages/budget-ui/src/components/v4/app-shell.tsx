'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import { NAV_ITEMS, isNavActive } from './nav-config';

const OWNER_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: '공동', label: '공동' },
  { id: '현준', label: '현준' },
  { id: '아내', label: '아내' },
];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

type IconComponent = React.ComponentType<{ size?: number }>;
function iconOf(name: string): IconComponent {
  return (Icons as unknown as Record<string, IconComponent>)[name] ?? Icons.Circle;
}

// 필터 칩: 활성 시 액센트/보조색, 비활성 시 hairline outline. 순수 Tailwind.
function chipClass(active: boolean, tone: 'accent' | 'secondary') {
  const base = 'inline-flex items-center h-11 px-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors';
  if (!active) return `${base} border border-[var(--fbv4-hairline)] text-[var(--fbv4-secondary)] hover:bg-[var(--fbv4-subtle)]`;
  if (tone === 'accent') return `${base} bg-[var(--fbv4-accent)] text-white`;
  return `${base} bg-[var(--fbv4-ink)] text-white`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const month = params.get('month') ?? currentMonth();
  const owner = params.get('owner') ?? 'all';

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  function hrefWithParams(base: string) {
    const q = new URLSearchParams();
    if (month) q.set('month', month);
    if (owner) q.set('owner', owner);
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  }

  // 월 칩: 선택월 기준 최근 6개월 + 앞뒤 페이저(미래월/과거월 도달)
  const [selY, selM] = month.split('-').map(Number);
  const shiftMonth = (delta: number) => {
    const d = new Date(selY, selM - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) months.push(shiftMonth(-i));

  return (
    <div className="fbv4 min-h-[100dvh] bg-[var(--fbv4-canvas)] flex flex-col md:flex-row">
      {/* 사이드 네비 (데스크톱) */}
      <nav className="hidden md:flex md:sticky md:top-0 md:h-[100dvh] md:flex-col md:w-56 md:shrink-0 bg-[var(--fbv4-surface)] border-r border-[var(--fbv4-hairline)] p-4 gap-1" aria-label="주요 화면">
        <div className="px-2 py-3 mb-2">
          <p className="text-xs font-bold text-[var(--fbv4-muted)]">우리</p>
          <p className="text-lg font-extrabold tracking-tight">펭귄 부부 가계부</p>
        </div>
        {NAV_ITEMS.map(item => {
          const Icon = iconOf(item.icon);
          const active = isNavActive(item.href, pathname);
          return (
            <Link
              key={item.key}
              href={hrefWithParams(item.href)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2.5 h-11 px-3 rounded-xl text-sm font-bold transition-colors ${
                active ? 'bg-[var(--fbv4-navy)] text-white shadow-[0_8px_18px_rgba(30,58,95,0.14)]' : 'text-[var(--fbv4-secondary)] hover:bg-[var(--fbv4-subtle)]'
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* 글로벌 바: 월 + 부담 필터 */}
        <header className="sticky top-0 z-10 bg-[var(--fbv4-surface)]/95 backdrop-blur border-b border-[var(--fbv4-hairline)] px-4 md:px-7 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1" role="group" aria-label="조회 월">
              <button type="button" data-fbv4-navigation onClick={() => setParam('month', shiftMonth(-1))} aria-label="이전 달"
                className="inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-full border border-[var(--fbv4-hairline)] text-[var(--fbv4-secondary)] hover:bg-[var(--fbv4-subtle)]">
                <Icons.ChevronLeft size={16} />
              </button>
              <span className="sm:hidden min-w-24 text-center text-sm font-extrabold" aria-live="polite">{selY}년 {selM}월</span>
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
              {months.map(m => {
                const [my, mm] = m.split('-').map(Number);
                // 선택월과 다른 연도면 '26.8 형식으로 구분
                const label = my === selY ? `${mm}월` : `'${String(my).slice(2)}.${mm}`;
                return (
                  <button key={m} type="button" data-fbv4-navigation onClick={() => setParam('month', m)} className={chipClass(m === month, 'accent')}>
                    {label}
                  </button>
                );
              })}
              </div>
              <button type="button" data-fbv4-navigation onClick={() => setParam('month', shiftMonth(1))} aria-label="다음 달"
                className="inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-full border border-[var(--fbv4-hairline)] text-[var(--fbv4-secondary)] hover:bg-[var(--fbv4-subtle)]">
                <Icons.ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-1 ml-auto overflow-x-auto" role="group" aria-label="조회 부담">
              {OWNER_OPTIONS.map(o => (
                <button key={o.id} type="button" data-fbv4-navigation onClick={() => setParam('owner', o.id)} className={chipClass(o.id === owner, 'secondary')}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 w-full max-w-[1236px] mx-auto p-4 pb-24 md:px-7 md:py-7">{children}</main>
      </div>

      {/* 하단 탭바 (모바일) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[var(--fbv4-surface)]/95 backdrop-blur border-t border-[var(--fbv4-hairline)] grid grid-cols-7 px-0.5 pt-1 pb-[calc(.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(16,32,51,0.08)]" aria-label="모바일 주요 화면">
        {NAV_ITEMS.map(item => {
          const Icon = iconOf(item.icon);
          const active = isNavActive(item.href, pathname);
          return (
            <Link key={item.key} href={hrefWithParams(item.href)} aria-current={active ? 'page' : undefined}
              className={`min-h-14 flex flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-bold ${active ? 'text-[var(--fbv4-accent)]' : 'text-[var(--fbv4-muted)]'}`}>
              <Icon size={19} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
