// components/AddTransactionForm.tsx - GREEN phase: Minimal implementation

'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Card, Button } from '@heroui/react';
import type { Transaction } from '@/lib/types';

interface AddTransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
}

export default function AddTransactionForm({ onSubmit }: AddTransactionFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'groceries',
    owner: 'alex',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'expense' | 'income',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      description: formData.description,
      amount: Number(formData.amount),
      category: formData.category,
      owner: formData.owner,
      date: formData.date,
      type: formData.type,
    });
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add Transaction</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back
        </Link>
      </header>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({ ...formData, type: 'expense' })}
                  className="mr-2"
                />
                Expense
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({ ...formData, type: 'income' })}
                  className="mr-2"
                />
                Income
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="groceries">Groceries</option>
              <option value="transport">Transport</option>
              <option value="healthcare">Healthcare</option>
              <option value="housing">Housing</option>
              <option value="subscriptions">Subscriptions</option>
              <option value="salary">Salary</option>
              <option value="savings">Savings</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="owner" className="block text-sm font-medium mb-2">
              Owner
            </label>
            <select
              id="owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="alex">Alex</option>
              <option value="jamie">Jamie</option>
              <option value="shared">Shared</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Add Transaction
          </Button>
        </form>
      </Card>
    </div>
  );
}
