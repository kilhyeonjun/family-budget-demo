'use client';

import { useEffect, useRef, useState } from 'react';
import { EntityCards } from './entity-cards';
import { EntityTable } from './entity-table';
import { RecurringRuleManager } from './recurring-rule-manager';
import { planEntitySave, type EntityRow } from '@/lib/v4/entity-save';
import { ENTITY_SPECS, type EntityKind, type EntityOptions } from '@/lib/v4/entity-config';
import { apiBridge } from '@/lib/synthetic-budget';

type Row = EntityRow;

// 서버→클라 경계엔 직렬화 가능한 값(kind)만 전달. spec의 empty 함수는 클라가 상수에서 로컬 참조.
export function EntityGrid({ kind, month, options, initialRows, gridHeight = 480 }: {
  kind: EntityKind;
  month: string;
  options: EntityOptions;
  initialRows: Record<string, unknown>[];
  gridHeight?: number;
}) {
  const spec = ENTITY_SPECS[kind];
  const [rows, setRows] = useState<Row[]>(initialRows as Row[]);
  const [savedRows, setSavedRows] = useState<Row[]>(initialRows as Row[]);
  const [deleteIds, setDeleteIds] = useState<Set<string>>(new Set());

  const [mobileLimit, setMobileLimit] = useState(12);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const allowNavigation = useRef(false);


  useEffect(() => {
    const next = initialRows as Row[];
    setRows(next);
    setSavedRows(next);
    setDeleteIds(new Set());

    setMobileLimit(12);
    setMessage('');
  }, [initialRows, month]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);


  const plan = planEntitySave(rows, savedRows, deleteIds, spec.emptyCheck);
  const changeCount = plan.creates.length + plan.updates.length + plan.deleteIds.length;

  useEffect(() => {
    if (changeCount === 0) { allowNavigation.current = false; return; }
    const confirmLeave = () => window.confirm(`저장 전 변경사항 ${changeCount}건이 있습니다. 저장하지 않고 이동할까요?`);
    const beforeUnload = (event: BeforeUnloadEvent) => { if (allowNavigation.current) return; event.preventDefault(); event.returnValue = ''; };
    const captureNavigation = (event: MouseEvent) => {
      if (allowNavigation.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest('a[href], [data-fbv4-navigation]') : null;
      if (!target) return;
      if (target instanceof HTMLAnchorElement) {
        const destination = new URL(target.href, window.location.href);
        if (destination.href === window.location.href) return;
      }
      if (!confirmLeave()) { event.preventDefault(); event.stopPropagation(); return; }
      if (target instanceof HTMLAnchorElement) {
        allowNavigation.current = true;
        window.setTimeout(() => { allowNavigation.current = false; }, 1000);
      }
    };
    const handlePopState = () => {
      if (allowNavigation.current) return;
      if (confirmLeave()) { allowNavigation.current = true; window.setTimeout(() => { allowNavigation.current = false; }, 1000); return; }
      allowNavigation.current = true;
      history.forward();
      window.setTimeout(() => { allowNavigation.current = false; }, 100);
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', captureNavigation, true);
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', captureNavigation, true); window.removeEventListener('popstate', handlePopState); };
  }, [changeCount]);

  async function save() {
    if (saving || changeCount === 0) return;
    setSaving(true);
    setMessage('');

    let nextRows = [...rows];
    let nextSavedRows = [...savedRows];
    const nextDeleteIds = new Set(deleteIds);
    let completed = 0;
    const syncProgress = () => {
      setRows(nextRows);
      setSavedRows(nextSavedRows);
      setDeleteIds(new Set(nextDeleteIds));
    };
    const request = async <T,>(input: RequestInfo | URL, init: RequestInit): Promise<T> => {
      const response = await apiBridge(input, init);
      const body = await response.json().catch(() => ({})) as T & { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || body.message || '저장 요청에 실패했어요.');
      return body;
    };

    try {
      for (const id of plan.deleteIds) {
        await request<{ ok: boolean }>(`${spec.apiPath}/${id}`, { method: 'DELETE' });
        nextRows = nextRows.filter(row => String(row.id) !== id);
        nextSavedRows = nextSavedRows.filter(row => String(row.id) !== id);
        nextDeleteIds.delete(id);
        completed += 1;
        syncProgress();
      }
      for (const update of plan.updates) {
        const body = await request<{ row?: Row }>(`${spec.apiPath}/${update.id}`, {
          method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(update.changed),
        });
        if (!body.row) throw new Error('저장 응답을 확인하지 못했어요.');
        nextRows = nextRows.map(row => String(row.id) === update.id ? body.row! : row);
        nextSavedRows = nextSavedRows.map(row => String(row.id) === update.id ? body.row! : row);
        completed += 1;
        syncProgress();
      }
      for (const create of plan.creates) {
        const body = await request<{ row?: Row }>(`${spec.apiPath}?month=${month}`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...create, month }),
        });
        if (!body.row) throw new Error('저장 응답을 확인하지 못했어요.');
        const index = nextRows.indexOf(create);
        if (index >= 0) nextRows = nextRows.map((row, rowIndex) => rowIndex === index ? body.row! : row);
        nextSavedRows = [body.row, ...nextSavedRows];
        completed += 1;
        syncProgress();
      }
      setMessage(`${completed}건 저장했어요.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '저장 중 문제가 생겼어요.';
      const progress = completed > 0 ? `${completed}건은 반영됐고, 남은 변경만 유지했어요. ` : '';
      setMessage(`${progress}${reason}`);
    } finally {
      setSaving(false);
    }
  }

  function addRow() {
    setRows(current => [spec.empty(month) as Row, ...current]);
    setMobileLimit(limit => Math.max(limit, 12));
  }
  function changeCell(rowIndex: number, key: string, value: unknown) {
    setRows(current => current.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)));
  }
  function toggleDelete(id?: string) {
    if (!id) return;
    setDeleteIds(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  const isEmpty = rows.length === 0;

  return (
    <fieldset disabled={saving} className="m-0 grid min-w-0 gap-3 border-0 p-0">
      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-[var(--fbv4-hairline)] p-10 grid gap-3 place-items-center text-center">
          <p className="font-bold text-[var(--fbv4-secondary)]">아직 이번 달 내역이 없어요.</p>
          <p className="text-sm text-[var(--fbv4-muted)]">‘행 추가’를 눌러 첫 항목을 입력하세요.</p>
          <button type="button" onClick={addRow} className="h-11 px-5 rounded-full bg-[var(--fbv4-accent)] text-white font-bold text-sm">행 추가</button>
        </div>
      ) : (
        <>
          {isDesktop === null ? (
            <div className="h-72 rounded-2xl bg-[var(--fbv4-subtle)] animate-pulse" aria-label="편집 화면 불러오는 중" />
          ) : isDesktop ? (
            kind === 'recurring' ? (
              <RecurringRuleManager columns={spec.columns} rows={rows} options={options} deleteIds={deleteIds} height={gridHeight} unsavedCount={changeCount} onChangeCell={changeCell} onToggleDelete={toggleDelete} />
            ) : (
              <EntityTable
                columns={spec.columns}
                rows={rows}
                savedRows={savedRows}
                options={options}
                deleteIds={deleteIds}
                height={gridHeight}
                onChangeCell={changeCell}
                onToggleDelete={toggleDelete}
              />
            )
          ) : (
            <div>
              <EntityCards
                columns={spec.columns}
                rows={rows.slice(0, mobileLimit)}
                options={options}
                onChangeCell={changeCell}
                deleteIds={deleteIds}
                onToggleDelete={toggleDelete}
              />
              {rows.length > mobileLimit && (
                <button type="button" onClick={() => setMobileLimit(limit => limit + 12)}
                  className="mt-3 w-full h-11 rounded-xl border border-[var(--fbv4-hairline)] text-sm font-bold text-[var(--fbv4-secondary)]">
                  더 보기 ({Math.min(12, rows.length - mobileLimit)}건)
                </button>
              )}
            </div>
          )}
        </>
      )}
      {!isEmpty && (
        <div className={`${changeCount > 0 ? 'sticky bottom-16 z-10' : ''} md:static flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--fbv4-canvas)]/95 py-2 backdrop-blur`}>
          <button type="button" onClick={addRow} className="h-11 px-4 rounded-full border border-[var(--fbv4-hairline)] font-bold text-sm hover:bg-[var(--fbv4-subtle)]">행 추가</button>

          <div className="ml-auto flex items-center gap-3">
            {changeCount > 0 && (
              <span className="text-sm font-bold text-[var(--fbv4-secondary)]">
                저장 전 변경사항 {changeCount}건 · 추가 {plan.creates.length} · 수정 {plan.updates.length} · 삭제 {plan.deleteIds.length}
              </span>
            )}
            <button type="button" onClick={save} disabled={saving || changeCount === 0}
              className="h-11 px-5 rounded-full bg-[var(--fbv4-accent)] text-white font-bold disabled:opacity-40">
              {saving ? '저장 중…' : '변경사항 저장'}
            </button>
          </div>
        </div>
      )}
      {message && <p role="status" aria-live="polite" className="text-sm font-bold text-[var(--fbv4-secondary)]">{message}</p>}
    </fieldset>
  );
}
