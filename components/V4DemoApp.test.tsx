import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import seed from '@/demo/seed-data.json';
import type { BudgetData } from '@/lib/types';
import V4DemoApp from './V4DemoApp';

const demoSeed = seed as BudgetData;
afterEach(() => { cleanup(); localStorage.clear(); });

describe('V4DemoApp', () => {
  it('renders synthetic-local disclosure and canonical navigation', () => {
    render(<V4DemoApp seed={demoSeed} />);
    expect(screen.getByText(/합성 데모.*브라우저에만 저장/i)).toBeDefined();
    expect(screen.getAllByRole('link', { name: '오늘' })[0].getAttribute('href')).toBe('/');
    expect(screen.getAllByRole('link', { name: '대시보드' })[0].getAttribute('href')).toBe('/dashboard');
    expect(screen.getAllByRole('link', { name: '거래원장' })[0].getAttribute('href')).toBe('/ledger');
    expect(screen.getByRole('heading', { name: '오늘의 기록' })).toBeDefined();
  });

  it('keeps dashboard arithmetic equal to the browser-local ledger after adding an expense', () => {
    const { rerender } = render(<V4DemoApp seed={demoSeed} />);
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '합성 지출' } });
    fireEvent.change(screen.getByLabelText('금액'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: '기록 추가' }));
    rerender(<V4DemoApp seed={demoSeed} screen="dashboard" />);
    expect(screen.getByText('₩299,420')).toBeDefined();
    expect(screen.getByText('₩3,900,580')).toBeDefined();
    rerender(<V4DemoApp seed={demoSeed} screen="ledger" />);
    expect(screen.getByText('합성 지출')).toBeDefined();
  });

  it('deletes only the selected seeded transaction', () => {
    render(<V4DemoApp seed={demoSeed} screen="ledger" />);
    fireEvent.click(screen.getByText('Weekly groceries').closest('.ledger-row')!.querySelector('button')!);
    expect(screen.queryByText('Weekly groceries')).toBeNull();
    expect(screen.getByText('Transit card top-up')).toBeDefined();
  });

  it('reset restores the synthetic seed and clears browser storage', () => {
    const { rerender } = render(<V4DemoApp seed={demoSeed} />);
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '초기화할 거래' } });
    fireEvent.change(screen.getByLabelText('금액'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: '기록 추가' }));
    expect(localStorage.getItem('family-budget-demo:v1')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '데모 초기화' }));
    expect(localStorage.getItem('family-budget-demo:v1')).toBeNull();
    rerender(<V4DemoApp seed={demoSeed} screen="ledger" />);
    expect(screen.queryByText('초기화할 거래')).toBeNull();
    expect(screen.getByText('Weekly groceries')).toBeDefined();
  });
});
