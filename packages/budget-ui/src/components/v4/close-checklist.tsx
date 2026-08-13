import type { DashboardCloseStatus } from '../../lib/dashboard-close';

function chip(ok: boolean, label: string) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${ok ? 'bg-[#ecfdf5] text-[var(--fbv4-income)]' : 'bg-[#fff7ed] text-[#c2410c]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-[var(--fbv4-income)]' : 'bg-[#c2410c]'}`} />{label}
    </span>
  );
}

export function CloseChecklist({ close }: { close: DashboardCloseStatus }) {
  return (
    <div className="rounded-2xl border border-[var(--fbv4-hairline)] p-4 grid gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">마감 체크리스트</span>
        {chip(close.close === '마감 가능', close.close === '마감 가능' ? '자료 입력 완료' : '자료 확인 필요')}
      </div>
      <div className="flex flex-wrap gap-2">
        {chip(close.needCheck === '0건', `확인 ${close.needCheck}`)}
        {chip(close.purpose === '입력됨', `목적통장 ${close.purpose}`)}
        {chip(close.assets === '완료', `자산 ${close.assets}`)}
      </div>
    </div>
  );
}
