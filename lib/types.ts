// lib/types.ts - Domain types based on seed data structure

export interface Household {
  id: string;
  name: string;
  members: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  displayName: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface Transaction {
  id?: string;
  date: string;
  owner: string;
  category: string;
  description: string;
  amount: number;
  type?: 'income' | 'expense';
}

export interface PurposeAccount {
  name: string;
  target: number;
  balance: number;
}

export interface Asset {
  month: string;
  owner: string;
  type: string;
  name: string;
  balance: number;
}

export interface RecurringItem {
  name: string;
  category: string;
  amount: number;
  status: 'active' | 'inactive';
}

export interface BudgetData {
  households: Household[];
  transactions: Transaction[];
  purposeAccounts: PurposeAccount[];
  assets: Asset[];
  recurring: RecurringItem[];
}
