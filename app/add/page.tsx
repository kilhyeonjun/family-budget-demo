'use client';

import { useRouter } from 'next/navigation';
import AddTransactionForm from '@/components/AddTransactionForm';
import type { Transaction } from '@/lib/types';

export default function AddTransactionPage() {
  const router = useRouter();

  const handleSubmit = async (transaction: Omit<Transaction, 'id'>) => {
    // In a real app, this would POST to an API route
    // For demo purposes, we'll just redirect back to dashboard
    console.log('Transaction submitted:', transaction);
    
    // Redirect to dashboard
    router.push('/');
  };

  return <AddTransactionForm onSubmit={handleSubmit} />;
}
