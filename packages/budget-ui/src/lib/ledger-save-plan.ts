export type LedgerRow = Record<string, unknown> & { id?: string };

export type LedgerSaveUpdate = {
  row: LedgerRow;
  saved: LedgerRow | undefined;
  index: number;
  changedKeys: string[];
};

export function changedRowKeys(row: LedgerRow, saved?: LedgerRow): string[] {
  const keys = new Set([...Object.keys(saved || {}), ...Object.keys(row)]);
  return Array.from(keys).filter(key => JSON.stringify(row[key]) !== JSON.stringify(saved?.[key]));
}

export function applySuccessfulLedgerResults(rows: LedgerRow[], savedRows: LedgerRow[], successfulDeleteIds: Set<string>) {
  const keep = (row: LedgerRow) => !row.id || !successfulDeleteIds.has(String(row.id));
  return {
    rows: rows.filter(keep),
    savedRows: savedRows.filter(keep),
  };
}

export function buildLedgerSavePlan(rows: LedgerRow[], savedRows: LedgerRow[], deleteCandidateIds: Set<string>) {
  const deleteIds = Array.from(deleteCandidateIds);
  const savedById = new Map(savedRows.filter(row => row.id).map(row => [String(row.id), row]));
  const updates: LedgerSaveUpdate[] = rows
    .map((row, index) => ({ row, index, saved: row.id ? savedById.get(String(row.id)) : undefined }))
    .filter(({ row, saved }) => Boolean(row.id) && !deleteCandidateIds.has(String(row.id)) && JSON.stringify(row) !== JSON.stringify(saved))
    .map(({ row, index, saved }) => ({ row, index, saved, changedKeys: changedRowKeys(row, saved) }));
  return { updates, deleteIds };
}
