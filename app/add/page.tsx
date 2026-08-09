'use client';

import { useRouter } from 'next/navigation';
import AddTransactionForm from '@/components/AddTransactionForm';
import seed from '@/demo/seed-data.json';
import { appendDemoTransaction, readDemoData, writeDemoData } from '@/lib/demo-storage';
import type { BudgetData, Transaction } from '@/lib/types';

export default function AddTransactionPage() {
  const router = useRouter();

  const handleSubmit = async (transaction: Omit<Transaction, 'id'>) => {
    writeDemoData(appendDemoTransaction(readDemoData(seed as BudgetData), transaction));
    router.push('/');
  };

  return <AddTransactionForm onSubmit={handleSubmit} />;
}
