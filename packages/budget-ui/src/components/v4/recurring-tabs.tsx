'use client';

import { useState, type ReactNode } from 'react';

export function RecurringTabs({ check, rules }: { check: ReactNode; rules: ReactNode }) {
  const [tab, setTab] = useState<'check' | 'rules'>('check');
  const tabs = [
    { id: 'check' as const, label: '이번 달 확인' },
    { id: 'rules' as const, label: '규칙 관리' },
  ];
  return (
    <div className="grid gap-3">
      <div role="tablist" aria-label="예상 항목 관리" className="inline-flex rounded-xl border border-[var(--fbv4-hairline)] p-1">
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`recurring-${item.id}`}
            id={`recurring-tab-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`h-11 px-4 text-sm font-extrabold rounded-lg ${tab === item.id ? 'bg-[var(--fbv4-ink)] text-white' : 'text-[var(--fbv4-secondary)]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section id="recurring-check" role="tabpanel" aria-labelledby="recurring-tab-check" hidden={tab !== 'check'}>{check}</section>
      <section id="recurring-rules" role="tabpanel" aria-labelledby="recurring-tab-rules" hidden={tab !== 'rules'}>{rules}</section>
    </div>
  );
}
