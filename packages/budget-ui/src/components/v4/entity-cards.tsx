'use client';

import { useEffect, useState } from 'react';
import type { EntityColumn, EntityOptions } from '../../lib/v4/entity-config';
import type { EntityRow } from '../../lib/v4/entity-save';

const inputStyle =
  'w-full h-11 px-3 rounded-xl border border-[var(--fbv4-hairline)] bg-[var(--fbv4-canvas)] text-sm outline-none focus:border-[var(--fbv4-accent)] focus:ring-2 focus:ring-[var(--fbv4-accent)]/30';

function formattedNumber(value: unknown) {
  if (value == null || value === '') return '';
  return new Intl.NumberFormat('ko-KR').format(Number(value) || 0);
}

export function EntityFieldInput({ col, value, onChange, options, ariaLabel }: {
  col: EntityColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  options: EntityOptions;
  ariaLabel?: string;
}) {
  if (col.kind === 'dropdown') {
    const current = value == null ? '' : String(value);
    const list = col.optionKey ? options[col.optionKey] ?? [] : [];
    const opts = current && !list.includes(current) ? [current, ...list] : list;
    return (
      <select aria-label={ariaLabel} className={inputStyle} value={current} onChange={event => onChange(event.target.value)}>
        <option value=""></option>
        {opts.map(option => <option key={option} value={option}>{col.optionLabels?.[option] ?? option}</option>)}
      </select>
    );
  }
  if (col.kind === 'flag') {
    return (
      <select aria-label={ariaLabel} className={inputStyle} value={Number(value) ? '1' : '0'} onChange={event => onChange(Number(event.target.value))}>
        <option value="0">포함</option>
        <option value="1">제외</option>
      </select>
    );
  }
  if (col.kind === 'number') {
    return (
      <input
        className={`${inputStyle} text-right fbv4-num`}
        aria-label={ariaLabel}
        inputMode="numeric"
        value={formattedNumber(value)}
        onChange={event => onChange(Number(event.target.value.replace(/[^0-9.-]/g, '')) || 0)}
      />
    );
  }
  return (
    <input
      type={col.kind === 'date' ? 'date' : col.kind === 'month' ? 'month' : 'text'}
      className={inputStyle}
      aria-label={ariaLabel}
      value={value == null ? '' : String(value)}
      placeholder={col.kind === 'date' ? 'YYYY-MM-DD' : col.kind === 'month' ? 'YYYY-MM' : ''}
      onChange={event => onChange(event.target.value)}
    />
  );
}

function summary(row: EntityRow) {
  const title = String(row.description ?? row.name ?? row.account_name ?? row.purpose_account ?? '(내용 없음)');
  const recurringMeta = 'monthly_amount' in row
    ? [
        `예상 생성 주기 ${row.cadence ?? 'monthly'}`,
        `실제 결제 주기 ${row.billing_cycle ?? 'monthly'}`,
        row.billing_months ? `결제월 ${row.billing_months}` : '',
        Number(row.expected_charge_amount ?? 0) > 0 ? `결제 예정 ${formattedNumber(row.expected_charge_amount)}원` : '',
        row.reconciliation_mode === 'excluded' ? '계획만' : '',
      ].filter(Boolean).join(' · ')
    : '';
  const context = [row.date ?? row.month ?? row.start_month, row.major_category ?? row.asset_type ?? row.item_type ?? row.deposit_type, recurringMeta]
    .filter(Boolean).join(' · ');
  const raw = row.amount ?? row.balance ?? row.monthly_amount;
  const amount = raw == null ? '' : new Intl.NumberFormat('ko-KR').format(Math.abs(Number(raw)));
  const transaction = 'description' in row;
  const income = transaction && row.major_category === '수입';
  return { title, context, amount, transaction, income };
}

export function EntityCards({ columns, rows, options, onChangeCell, deleteIds, onToggleDelete }: {
  columns: EntityColumn[];
  rows: EntityRow[];
  options: EntityOptions;
  onChangeCell: (rowIndex: number, key: string, value: unknown) => void;
  deleteIds: Set<string>;
  onToggleDelete: (id?: string) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (rows[0] && !rows[0].id) setOpenKey('new-0');
  }, [rows]);

  return (
    <div className="grid gap-3">
      {rows.map((row, index) => {
        const id = row.id ? String(row.id) : undefined;
        const key = id ?? `new-${index}`;
        const marked = id ? deleteIds.has(id) : false;
        const open = openKey === key;
        const info = summary(row);
        return (
          <article key={key} className={`rounded-2xl border p-3 grid gap-3 ${marked ? 'border-[var(--fbv4-expense)] opacity-60' : 'border-[var(--fbv4-hairline)]'}`}>
            <button type="button" onClick={() => setOpenKey(current => current === key ? null : key)}
              className="min-h-11 flex items-center gap-3 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fbv4-accent)]">
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold truncate">{info.title}</span>
                <span className="block text-xs text-[var(--fbv4-muted)] truncate">{info.context || '세부 정보를 확인하세요'}</span>
              </span>
              {info.amount && (
                <span className={`fbv4-num shrink-0 font-extrabold ${info.transaction ? (info.income ? 'fbv4-money-in' : 'fbv4-money-out') : 'text-[var(--fbv4-ink)]'}`}>
                  {info.transaction ? (info.income ? '+' : '−') : ''}{info.amount}
                </span>
              )}
              <span className="shrink-0 text-sm font-bold text-[var(--fbv4-accent)]">{open ? '접기' : '편집'}</span>
            </button>

            {open && (
              <div className="grid gap-2 border-t border-[var(--fbv4-hairline)] pt-3">
                {columns.map(column => (
                  <label key={column.key} className="grid gap-1">
                    <span className="text-xs font-bold text-[var(--fbv4-muted)]">{column.title}</span>
                    <EntityFieldInput col={column} value={row[column.key]} options={options} onChange={value => onChangeCell(index, column.key, value)} />
                  </label>
                ))}
                <button type="button" onClick={() => onToggleDelete(id)}
                  className="justify-self-end h-11 px-4 rounded-full border border-[var(--fbv4-hairline)] text-sm font-bold text-[var(--fbv4-expense)] hover:bg-[var(--fbv4-subtle)]">
                  {marked ? '삭제 취소' : '삭제 표시'}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
