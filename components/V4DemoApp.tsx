'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { BudgetData, Transaction } from '@/lib/types';
import { appendDemoTransaction, calculateDemoSummary, readDemoData, resetDemoData, writeDemoData } from '@/lib/demo-storage';

const MONTH = '2026-06';
const won = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`;
const nav = [['오늘', '/'], ['대시보드', '/dashboard'], ['거래원장', '/ledger']] as const;

export default function V4DemoApp({ seed, screen = 'today', editId = null }: { seed: BudgetData; screen?: 'today' | 'dashboard' | 'ledger'; editId?: string | null }) {
  const [data, setData] = useState(() => readDemoData(seed));
  const commit = (next: BudgetData) => { writeDemoData(next); setData(next); };
  const save = (transaction: Omit<Transaction, 'id'>) => commit(editId
    ? { ...data, transactions: data.transactions.map((item) => item.id === editId ? { ...item, ...transaction, id: item.id } : item) }
    : appendDemoTransaction(data, transaction));
  const remove = (id?: string) => commit({ ...data, transactions: data.transactions.filter((item) => item.id !== id) });
  const summary = calculateDemoSummary(data.transactions, MONTH);
  const transactions = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));

  return <div className="fbv4">
    <aside className="side-nav" aria-label="주요 화면"><strong>펭귄 부부 가계부</strong>{nav.map(([label, href]) => <Link key={href} href={href} aria-current={(screen === 'today' && href === '/') || screen === href.slice(1) ? 'page' : undefined}>{label}</Link>)}</aside>
    <main>
      <div role="note" className="disclosure"><strong>합성 데모 · 브라우저에만 저장</strong><span>실제 가족 데이터, API, 로그인, 외부 전송은 없습니다.</span><button type="button" onClick={() => { resetDemoData(); setData(readDemoData(seed)); }}>데모 초기화</button></div>
      <header className="topbar"><span>2026년 6월</span><span>전체</span></header>
      {screen === 'today' && <Today onSave={save} editing={editId ? data.transactions.find((item) => item.id === editId) : undefined} transactions={transactions} />}
      {screen === 'dashboard' && <Dashboard data={data} summary={summary} transactions={transactions} />}
      {screen === 'ledger' && <Ledger transactions={transactions} onDelete={remove} onPersist={() => writeDemoData(data)} />}
    </main>
    <nav className="bottom-nav" aria-label="모바일 주요 화면">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
  </div>;
}

function Today({ onSave, editing, transactions }: { onSave: (transaction: Omit<Transaction, 'id'>) => void; editing?: Transaction; transactions: Transaction[] }) {
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount] = useState(editing?.amount ? String(editing.amount) : '');
  const [type, setType] = useState<'income' | 'expense'>(editing?.type ?? 'expense');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ description, amount: Number(amount), type, date: editing?.date ?? '2026-06-30', category: editing?.category ?? '생활', owner: editing?.owner ?? '공동' });
    setDescription(''); setAmount('');
  };
  return <section className="page"><p className="eyebrow">TODAY</p><h1>오늘의 기록</h1><p className="muted">빠른 입력으로 실제 입출금 내역을 기록하세요.</p><form className="entry-card" onSubmit={submit}><label>내용<input required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="예: 장보기" /></label><label>금액<input required min="0" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></label><fieldset><legend>유형</legend><label><input type="radio" checked={type === 'expense'} onChange={() => setType('expense')} /> 지출</label><label><input type="radio" checked={type === 'income'} onChange={() => setType('income')} /> 수입</label></fieldset><button className="primary" type="submit">{editing ? '수정 저장' : '기록 추가'}</button></form><section className="panel recent"><h2>최근 내역</h2>{transactions.slice(0, 5).map((item, index) => <TransactionRow item={item} key={item.id ?? index} />)}</section></section>;
}

function Dashboard({ data, summary, transactions }: { data: BudgetData; summary: ReturnType<typeof calculateDemoSummary>; transactions: Transaction[] }) {
  const recurring = data.recurring.filter((item) => item.status === 'active').reduce((sum, item) => sum + item.amount, 0);
  const plannedBalance = summary.income - summary.expenses - recurring;
  const categories = Object.entries(transactions.filter((item) => item.type !== 'income').reduce<Record<string, number>>((totals, item) => ({ ...totals, [item.category]: (totals[item.category] ?? 0) + item.amount }), {})).sort((a, b) => b[1] - a[1]);
  return <section className="page"><p className="eyebrow">DASHBOARD</p><h1>이번 달 판단과 할 일</h1><section className={`decision ${plannedBalance >= 0 ? 'safe' : 'risk'}`}><strong>{plannedBalance >= 0 ? '계획 범위 안이에요' : '지출 조정이 필요해요'}</strong><span>예상 잔액 {won(plannedBalance)}</span></section><div className="kpis"><Kpi label="수입" amount={summary.income} tone="income" /><Kpi label="지출" amount={summary.expenses} tone="expense" /><Kpi label="현재 잔액" amount={summary.balance} /></div><div className="dashboard-grid"><section className="panel"><h2>카테고리별 지출</h2>{categories.map(([category, amount]) => <div className="ranking" key={category}><span>{category}</span><strong>{won(amount)}</strong></div>)}</section><section className="panel checklist"><h2>월 마감 체크</h2><label><input type="checkbox" defaultChecked={transactions.length > 0} /> 거래 입력 확인</label><label><input type="checkbox" defaultChecked={summary.income > 0} /> 실제 수입 확인</label><label><input type="checkbox" /> 목적통장 잔액 확인</label></section></div></section>;
}
function Kpi({ label, amount, tone = '' }: { label: string; amount: number; tone?: string }) { return <section className={`kpi ${tone}`}><span>{label}</span><strong>{won(amount)}</strong></section>; }
function Ledger({ transactions, onDelete, onPersist }: { transactions: Transaction[]; onDelete: (id?: string) => void; onPersist: () => void }) { const [saved, setSaved] = useState(false); return <section className="page"><p className="eyebrow">LEDGER</p><h1>거래원장</h1><section className="panel ledger"><div className="ledger-actions"><Link href="/">행 추가</Link><button type="button" onClick={() => { onPersist(); setSaved(true); }}>변경사항 저장</button></div>{saved && <p role="status">브라우저에 저장됨</p>}<div className="table-wrap"><table aria-label="거래원장 편집 표"><thead><tr>{['날짜', '내용', '분류', '소유자', '금액', '관리'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{transactions.map((item, index) => <tr key={item.id ?? index}><td>{item.date}</td><td>{item.description}</td><td>{item.category}</td><td>{item.owner}</td><td className={item.type === 'income' ? 'money-in' : 'money-out'}>{item.type === 'income' ? '+' : '-'}{won(item.amount)}</td><td><Link href={`/?edit=${item.id}`}>수정</Link><button type="button" onClick={() => onDelete(item.id)}>삭제</button></td></tr>)}</tbody></table></div></section></section>; }
function TransactionRow({ item }: { item: Transaction }) { return <div className="transaction"><span><strong>{item.description}</strong><small>{item.category} · {item.owner}</small></span><strong className={item.type === 'income' ? 'money-in' : 'money-out'}>{item.type === 'income' ? '+' : '-'}{won(item.amount)}</strong></div>; }
