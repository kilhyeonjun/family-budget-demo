'use client';

import { useState } from 'react';
import { apiBridge } from '@/lib/synthetic-budget';

type Item = { id: string | null; label: string; sortOrder: number; editable: boolean; source: string };
type Group = { key: string; title: string; writeKind: string; items: Item[] };

// owners는 부담 주체(공동/현준/아내) — 고정값이라 추가 불가.
const NO_ADD = new Set(['owners']);

export function SettingsManager({ groups: initial }: { groups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initial);
  const [selected, setSelected] = useState<string>(initial.find(g => !NO_ADD.has(g.key))?.key ?? initial[0]?.key ?? '');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const group = groups.find(g => g.key === selected);

  async function reload() {
    const r = await apiBridge('/api/settings').then(res => res.json()).catch(() => null);
    if (r?.settingGroups) setGroups(r.settingGroups);
  }

  async function run(fn: () => Promise<Response>) {
    setBusy(true); setError('');
    try {
      const res = await fn();
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        // 서버는 error 필드에 사용자용 한글 메시지를 담아 반환(사용 중/중복/보호값 등).
        setError(b.error || b.message || '변경하지 못했어요.');
        return false;
      }
      await reload();
      return true;
    } catch {
      setError('네트워크 문제로 변경하지 못했어요.');
      return false;
    } finally { setBusy(false); }
  }

  async function add() {
    const label = draft.trim();
    if (!label || !group) return;
    const ok = await run(() => apiBridge('/api/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ groupKey: group.key, label }) }));
    if (ok) setDraft('');
  }
  async function saveEdit() {
    if (!editing) return;
    const label = editing.label.trim();
    if (!label) return;
    const ok = await run(() => apiBridge('/api/settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ groupKey: group?.key, id: editing.id, label }) }));
    if (ok) setEditing(null);
  }
  async function remove(id: string) {
    if (pendingDelete !== id) { setPendingDelete(id); return; }
    const ok = await run(() => apiBridge(`/api/settings?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ groupKey: group?.key }) }));
    if (ok) setPendingDelete(null);
  }

  const protectedItems = group?.items.filter(i => !i.editable) ?? [];
  const familyItems = group?.items.filter(i => i.editable) ?? [];

  return (
    <div className="grid gap-0 overflow-hidden rounded-[var(--fbv4-radius-card)] border border-[var(--fbv4-hairline)] bg-[var(--fbv4-surface)] shadow-[var(--fbv4-shadow-card)] md:grid-cols-[220px_1fr] items-stretch">
      {/* 그룹 rail */}
      <nav className="flex overflow-x-auto md:grid md:content-start gap-1 border-b border-[var(--fbv4-hairline)] p-3 md:border-b-0 md:border-r">
        {groups.map(g => (
          <button key={g.key} type="button" onClick={() => { setSelected(g.key); setEditing(null); setPendingDelete(null); setError(''); }}
            className={`min-h-11 shrink-0 text-left px-3 py-2 rounded-xl font-bold text-sm ${g.key === selected ? 'bg-[var(--fbv4-navy)] text-white' : 'text-[var(--fbv4-secondary)] hover:bg-[var(--fbv4-subtle)]'}`}>
            {g.title}
          </button>
        ))}
      </nav>

      {/* workspace */}
      <div className="grid content-start gap-4 p-4 md:p-5">
        {group && !NO_ADD.has(group.key) && (
          <form onSubmit={e => { e.preventDefault(); add(); }} className="flex gap-2">
            <input value={draft} onChange={e => setDraft(e.target.value)} aria-label={`${group.title} 항목 추가`} placeholder={`${group.title} 항목 추가`} maxLength={40}
              className="flex-1 h-11 px-4 rounded-xl border border-[var(--fbv4-hairline)] bg-white text-sm" />
            <button type="submit" disabled={busy || !draft.trim()} className="h-11 px-5 rounded-xl bg-[var(--fbv4-accent)] text-white font-bold disabled:opacity-40">추가</button>
          </form>
        )}
        {group && NO_ADD.has(group.key) && (
          <p className="text-sm text-[var(--fbv4-secondary)]">부담 주체는 고정값이라 추가·삭제할 수 없어요.</p>
        )}
        {error && <p role="alert" className="text-sm font-bold text-[var(--fbv4-expense)]">{error}</p>}

        {familyItems.length > 0 && (
          <div className="grid gap-2">
            <p className="text-xs font-bold text-[var(--fbv4-muted)]">직접 추가한 항목</p>
            {familyItems.map(i => (
              <div key={i.id} className="flex items-center gap-2 rounded-xl border border-[var(--fbv4-hairline)] px-4 py-2">
                {editing?.id === i.id ? (
                  <>
                    <input value={editing.label} onChange={e => setEditing({ id: editing.id, label: e.target.value })} aria-label={`${i.label} 이름`} maxLength={40}
                      className="flex-1 h-9 px-3 rounded-lg border border-[var(--fbv4-hairline)] text-sm" autoFocus />
                    <button type="button" onClick={saveEdit} disabled={busy} className="h-11 px-3 rounded-lg bg-[var(--fbv4-accent)] text-white font-bold text-sm">저장</button>
                    <button type="button" onClick={() => setEditing(null)} className="h-11 px-3 rounded-lg font-bold text-sm text-[var(--fbv4-secondary)]">취소</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-bold text-sm">{i.label}</span>
                    <button type="button" onClick={() => setEditing({ id: i.id as string, label: i.label })} className="h-11 px-3 rounded-lg font-bold text-sm text-[var(--fbv4-secondary)] hover:bg-[var(--fbv4-subtle)]">이름 변경</button>
                    <button type="button" onClick={() => void remove(i.id as string)} disabled={busy}
                      className={`h-11 px-3 rounded-lg font-bold text-sm ${pendingDelete === i.id ? 'bg-[var(--fbv4-expense)] text-white' : 'text-[var(--fbv4-expense)] hover:bg-[var(--fbv4-subtle)]'}`}>
                      {pendingDelete === i.id ? '정말 삭제' : '삭제'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {protectedItems.length > 0 && (
          <div className="grid gap-2">
            <p className="text-xs font-bold text-[var(--fbv4-muted)]">기본값 (보호됨)</p>
            <div className="flex flex-wrap gap-2">
              {protectedItems.map(i => (
                <span key={i.label} className="px-3 py-1.5 rounded-full bg-[var(--fbv4-subtle)] text-[var(--fbv4-secondary)] text-sm font-bold">{i.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
