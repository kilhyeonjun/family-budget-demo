'use client';

import { EntityFieldInput } from './entity-cards';
import type { EntityColumn, EntityOptions } from '@/lib/v4/entity-config';
import type { EntityRow } from '@/lib/v4/entity-save';

export function EntityTable({ columns, rows, savedRows, options, deleteIds, height, onChangeCell, onToggleDelete }: {
  columns: EntityColumn[];
  rows: EntityRow[];
  savedRows: EntityRow[];
  options: EntityOptions;
  deleteIds: Set<string>;
  height: number;
  onChangeCell: (rowIndex: number, key: string, value: unknown) => void;
  onToggleDelete: (id?: string) => void;
}) {
  const savedById = new Map(savedRows.map(row => [String(row.id), row]));
  return (
    <div className="overflow-auto rounded-2xl border border-[var(--fbv4-hairline)]" style={{ maxHeight: height }}>
      <table className="w-full min-w-max border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--fbv4-subtle)]">
          <tr>
            <th scope="col" className="w-12 border-b border-r border-[var(--fbv4-hairline)] px-3 py-3 text-right text-[var(--fbv4-secondary)]">#</th>
            {columns.map(column => (
              <th key={column.key} scope="col" style={{ minWidth: column.width }}
                className="border-b border-r border-[var(--fbv4-hairline)] px-3 py-3 text-left font-bold text-[var(--fbv4-secondary)]">
                {column.title}
              </th>
            ))}
            <th scope="col" className="min-w-24 border-b border-[var(--fbv4-hairline)] bg-[var(--fbv4-subtle)] px-3 py-3 text-center text-[var(--fbv4-secondary)]">작업</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const id = row.id ? String(row.id) : undefined;
            const saved = id ? savedById.get(id) : undefined;
            const marked = id ? deleteIds.has(id) : false;
            return (
              <tr key={id ?? `new-${rowIndex}`} className={marked ? 'bg-red-50 opacity-60' : undefined}>
                <th scope="row" className="border-b border-r border-[var(--fbv4-hairline)] px-3 text-right font-semibold text-[var(--fbv4-muted)]">{rowIndex + 1}</th>
                {columns.map(column => {
                  const dirty = !id || saved?.[column.key] !== row[column.key];
                  return (
                    <td key={column.key} style={{ minWidth: column.width }}
                      className={`border-b border-r border-[var(--fbv4-hairline)] p-1 ${dirty ? 'bg-blue-50' : ''}`}>
                      <EntityFieldInput
                        col={column}
                        value={row[column.key]}
                        options={options}
                        ariaLabel={`${rowIndex + 1}행 ${column.title}`}
                        onChange={value => onChangeCell(rowIndex, column.key, value)}
                      />
                    </td>
                  );
                })}
                <td className="border-b border-[var(--fbv4-hairline)] bg-white p-1 text-center">
                  {id ? (
                    <button type="button" onClick={() => onToggleDelete(id)}
                      className="h-11 rounded-xl px-3 text-sm font-bold text-[var(--fbv4-expense)] hover:bg-[var(--fbv4-subtle)]">
                      {marked ? '삭제 취소' : '삭제 표시'}
                    </button>
                  ) : <span className="text-xs font-bold text-[var(--fbv4-muted)]">신규</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
