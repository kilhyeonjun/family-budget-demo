// lib/data-loader.test.ts - RED phase: Test for loading seed data

import { describe, it, expect } from 'vitest';
import { loadSeedData } from './data-loader';

describe('loadSeedData', () => {
  it('should load and parse seed data from JSON', async () => {
    const data = await loadSeedData();
    
    expect(data).toBeDefined();
    expect(data.households).toBeDefined();
    expect(data.transactions).toBeDefined();
    expect(Array.isArray(data.households)).toBe(true);
    expect(Array.isArray(data.transactions)).toBe(true);
  });

  it('should load demo household data', async () => {
    const data = await loadSeedData();
    
    expect(data.households.length).toBeGreaterThan(0);
    expect(data.households[0].id).toBe('demo-household-alpha');
    expect(data.households[0].name).toBe('Demo Household');
  });

  it('should load transaction data', async () => {
    const data = await loadSeedData();
    
    expect(data.transactions.length).toBeGreaterThan(0);
    expect(data.transactions[0]).toHaveProperty('date');
    expect(data.transactions[0]).toHaveProperty('amount');
    expect(data.transactions[0]).toHaveProperty('category');
  });
});
