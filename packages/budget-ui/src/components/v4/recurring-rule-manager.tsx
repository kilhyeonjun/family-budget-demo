'use client';

import { useEffect, useRef, useState } from 'react';
import { EntityFieldInput } from './entity-cards';
import type { EntityColumn, EntityOptions } from '../../lib/v4/entity-config';
import type { EntityRow } from '../../lib/v4/entity-save';

function money(value: unknown) { return `${new Intl.NumberFormat('ko-KR').format(Math.abs(Number(value) || 0))}원`; }
function cycle(value: unknown) { return value === 'annual' ? '연간' : value === 'quarterly' ? '분기' : '매월'; }
function expectedCharge(row: EntityRow) { const explicit = Number(row.expected_charge_amount) || 0; const monthly = Math.abs(Number(row.monthly_amount) || 0); return explicit || (row.billing_cycle === 'annual' ? monthly * 12 : row.billing_cycle === 'quarterly' ? monthly * 3 : monthly); }

export function RecurringRuleManager({ columns, rows, options, deleteIds, height, unsavedCount, onChangeCell, onToggleDelete }: {
  columns: EntityColumn[];
  rows: EntityRow[];
  options: EntityOptions;
  deleteIds: Set<string>;
  height: number;
  unsavedCount: number;
  onChangeCell: (rowIndex: number, key: string, value: unknown) => void;
  onToggleDelete: (id?: string) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editingIndex = editingKey == null ? -1 : rows.findIndex((row, index) => (row.id ? `id:${row.id}` : `new:${index}`) === editingKey);
  const editing = editingIndex < 0 ? null : rows[editingIndex];
  useEffect(() => { if (editingKey && !editing) setEditingKey(null); }, [editingKey, editing]);
  useEffect(() => {
    if (!editingKey) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setEditingKey(null); return; }
      if (event.key !== 'Tab') return;
      const items = focusable(); if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = oldOverflow; if (dialog.open) dialog.close(); previous?.focus(); };
  }, [editingKey]);

  return (
    <>
      <div className="overflow-auto rounded-2xl border border-[var(--fbv4-hairline)]" style={{ maxHeight: height }}>
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="bg-[var(--fbv4-subtle)] text-left text-xs font-bold text-[var(--fbv4-secondary)]">
            <tr><th className="sticky left-0 bg-[var(--fbv4-subtle)] px-4 py-3">이름</th><th className="px-3 py-3">종류</th><th className="px-3 py-3">결제 주기</th><th className="px-3 py-3 text-right">월 예산</th><th className="px-3 py-3 text-right">결제 예정액</th><th className="px-3 py-3">확인 방식</th><th className="px-3 py-3">상태</th><th className="px-3 py-3 text-center">작업</th></tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const id = row.id ? String(row.id) : undefined;
              const marked = id ? deleteIds.has(id) : false;
              return <tr key={id ?? `new-${index}`} className={`border-t border-[var(--fbv4-hairline)] ${marked ? 'bg-red-50 opacity-60' : ''}`}>
                <th scope="row" className="sticky left-0 max-w-64 bg-[var(--fbv4-canvas)] px-4 py-3 text-left font-extrabold">{String(row.name || '(새 규칙)')}</th>
                <td className="px-3 py-3">{String(row.item_type || '')}</td>
                <td className="px-3 py-3">{cycle(row.billing_cycle)}{row.billing_months ? ` · ${row.billing_months}월` : ''}</td>
                <td className="px-3 py-3 text-right font-bold">{money(row.monthly_amount)}</td>
                <td className="px-3 py-3 text-right font-bold">{money(expectedCharge(row))}</td>
                <td className="px-3 py-3">{row.reconciliation_mode === 'excluded' ? '계획만' : '확인함'}</td>
                <td className="px-3 py-3">{String(row.status || '')}</td>
                <td className="px-3 py-2 text-center"><button type="button" onClick={() => setEditingKey(id ? `id:${id}` : `new:${index}`)} className="h-10 rounded-full border border-[var(--fbv4-hairline)] px-4 text-xs font-extrabold hover:bg-[var(--fbv4-subtle)]">상세 편집</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {editing && editingIndex >= 0 && (
        <dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="recurring-rule-dialog-title" onCancel={event => { event.preventDefault(); setEditingKey(null); }} className="fixed inset-y-0 left-auto right-0 m-0 h-dvh w-full max-w-2xl overflow-y-auto border-0 bg-[var(--fbv4-canvas)] p-5 shadow-2xl backdrop:bg-black/35">
            <div className="sticky top-0 z-10 mb-5 flex items-center gap-3 bg-[var(--fbv4-canvas)] py-2">
              <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[var(--fbv4-muted)]">반복 규칙 상세 편집{unsavedCount > 0 ? ` · 저장 전 변경사항 ${unsavedCount}건` : ''}</p><h2 id="recurring-rule-dialog-title" className="truncate text-xl font-extrabold">{String(editing.name || '새 규칙')}</h2></div>
              <button type="button" onClick={() => setEditingKey(null)} className="h-10 rounded-full border border-[var(--fbv4-hairline)] px-4 text-sm font-bold">닫기</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {columns.map(column => <label key={column.key} className={`grid gap-1 text-xs font-bold text-[var(--fbv4-muted)] ${column.key === 'reconciliation_note' ? 'sm:col-span-2' : ''}`}>{column.title}<EntityFieldInput col={column} value={editing[column.key]} options={options} ariaLabel={`상세 편집 ${column.title}`} onChange={value => onChangeCell(editingIndex, column.key, value)} /></label>)}
            </div>
            <div className="mt-6 flex justify-between border-t border-[var(--fbv4-hairline)] pt-4">
              {editing.id ? <button type="button" onClick={() => onToggleDelete(String(editing.id))} className="h-10 rounded-full px-4 text-sm font-bold text-[var(--fbv4-expense)]">{deleteIds.has(String(editing.id)) ? '삭제 취소' : '삭제 표시'}</button> : <span />}
              <div className="grid justify-items-end gap-1"><button type="button" onClick={() => setEditingKey(null)} className="h-10 rounded-full bg-[var(--fbv4-accent)] px-5 text-sm font-extrabold text-white">목록으로 돌아가기{unsavedCount > 0 ? ' (저장 전)' : ''}</button>{unsavedCount > 0 && <span className="text-xs font-bold text-[var(--fbv4-muted)]">목록 하단에서 저장해야 반영됩니다.</span>}</div>
            </div>
        </dialog>
      )}
    </>
  );
}
