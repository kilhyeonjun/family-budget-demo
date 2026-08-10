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
  const save = (transaction: Omit<Transaction, 'id'>) => {
    const next = editId
      ? { ...data, transactions: data.transactions.map((item) => item.id === editId ? { ...item, ...transaction, id: item.id } : item) }
      : appendDemoTransaction(data, transaction);
    writeDemoData(next);
    setData(next);
  };
  const remove = (id?: string) => {
    const next = { ...data, transactions: data.transactions.filter((item) => item.id !== id) };
    writeDemoData(next);
    setData(next);
  };
  const summary = calculateDemoSummary(data.transactions, MONTH);
  const transactions = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));

  return <div className="fbv4">
    <aside className="side-nav" aria-label="주요 화면"><strong>펭귄 부부 가계부</strong>{nav.map(([label, href]) => <Link key={href} href={href} aria-current={(screen === 'today' && href === '/') || screen === href.slice(1) ? 'page' : undefined}>{label}</Link>)}</aside>
    <main>
      <div role="note" className="disclosure"><strong>합성 데모 · 브라우저에만 저장</strong><span>실제 가족 데이터, API, 로그인, 외부 전송은 없습니다.</span><button type="button" onClick={() => { resetDemoData(); setData(readDemoData(seed)); }}>데모 초기화</button></div>
      <header className="topbar"><span>2026년 6월</span><span>전체</span></header>
      {screen === 'today' && <Today onSave={save} editing={editId ? data.transactions.find((item) => item.id === editId) : undefined} />}
      {screen === 'dashboard' && <Dashboard summary={summary} transactions={transactions} />}
      {screen === 'ledger' && <Ledger transactions={transactions} onDelete={remove} />}
    </main>
    <nav className="bottom-nav" aria-label="모바일 주요 화면">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
  </div>;
}

function Today({ onSave, editing }: { onSave: (transaction: Omit<Transaction, 'id'>) => void; editing?: Transaction }) {
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount] = useState(editing?.amount ? String(editing.amount) : '');
  const [type, setType] = useState<'income' | 'expense'>(editing?.type ?? 'expense');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ description, amount: Number(amount), type, date: editing?.date ?? '2026-06-30', category: editing?.category ?? '생활', owner: editing?.owner ?? '공동' });
    setDescription(''); setAmount('');
  };
  return <section className="page"><p className="eyebrow">TODAY</p><h1>오늘의 기록</h1><p className="muted">지출과 수입을 간단히 기록하세요.</p><form className="entry-card" onSubmit={submit}><label>내용<input required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="예: 장보기" /></label><label>금액<input required min="0" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></label><fieldset><legend>유형</legend><label><input type="radio" checked={type === 'expense'} onChange={() => setType('expense')} /> 지출</label><label><input type="radio" checked={type === 'income'} onChange={() => setType('income')} /> 수입</label></fieldset><button className="primary" type="submit">{editing ? '수정 저장' : '기록 추가'}</button></form></section>;
}

function Dashboard({ summary, transactions }: { summary: ReturnType<typeof calculateDemoSummary>; transactions: Transaction[] }) {
  return <section className="page"><p className="eyebrow">DASHBOARD</p><h1>이번 달 흐름</h1><div className="kpis"><Kpi label="수입" amount={summary.income} tone="income" /><Kpi label="지출" amount={summary.expenses} tone="expense" /><Kpi label="잔액" amount={summary.balance} /></div><section className="panel"><h2>최근 거래</h2>{transactions.slice(0, 5).map((item, index) => <TransactionRow item={item} key={item.id ?? index} />)}</section></section>;
}
function Kpi({ label, amount, tone = '' }: { label: string; amount: number; tone?: string }) { return <section className={`kpi ${tone}`}><span>{label}</span><strong>{won(amount)}</strong></section>; }
function Ledger({ transactions, onDelete }: { transactions: Transaction[]; onDelete: (id?: string) => void }) { return <section className="page"><p className="eyebrow">LEDGER</p><h1>거래원장</h1><section className="panel ledger"><div className="ledger-head"><span>날짜</span><span>내용</span><span>금액</span><span>관리</span></div>{transactions.map((item, index) => <div className="ledger-row" key={item.id ?? index}><span>{item.date}</span><TransactionRow item={item} /><span><Link href={`/?edit=${item.id}`}>수정</Link><button type="button" onClick={() => onDelete(item.id)}>삭제</button></span></div>)}</section></section>; }
function TransactionRow({ item }: { item: Transaction }) { return <div className="transaction"><span><strong>{item.description}</strong><small>{item.category} · {item.owner}</small></span><strong className={item.type === 'income' ? 'money-in' : 'money-out'}>{item.type === 'income' ? '+' : '-'}{won(item.amount)}</strong></div>; }
