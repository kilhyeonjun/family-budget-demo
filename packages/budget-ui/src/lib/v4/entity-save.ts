import { buildLedgerSavePlan, type LedgerRow } from '../ledger-save-plan';

export type EntityRow = LedgerRow;
export type EntitySavePlan = {
  creates: EntityRow[];
  updates: { id: string; changed: Record<string, unknown> }[];
  deleteIds: string[];
};

// 빈 신규행 판정: 식별 텍스트 + 금액이 모두 비면 스킵(사용자가 '행 추가'만 누르고 안 채운 경우).
function isEmptyNew(row: EntityRow, textKey: string, amountKey: string): boolean {
  const text = String(row[textKey] ?? '').trim();
  const amount = Number(String(row[amountKey] ?? '').toString().replaceAll(',', '')) || 0;
  return !text && !amount;
}

// 엔티티 무관 저장 계획. 원장 planLedgerSave의 일반화 — emptyCheck 키를 인자로 받는다.
export function planEntitySave(rows: EntityRow[], savedRows: EntityRow[], deleteIds: Set<string>, emptyCheck: { text: string; amount: string }): EntitySavePlan {
  const creates = rows.filter(r => !r.id && !isEmptyNew(r, emptyCheck.text, emptyCheck.amount));
  const plan = buildLedgerSavePlan(rows, savedRows, deleteIds);
  const updates = plan.updates.map(u => {
    const changed: Record<string, unknown> = {};
    for (const key of u.changedKeys) changed[key] = u.row[key];
    return { id: String(u.row.id), changed };
  });
  return { creates, updates, deleteIds: plan.deleteIds };
}
