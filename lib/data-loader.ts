// lib/data-loader.ts - GREEN phase: Minimal implementation

import { promises as fs } from 'fs';
import path from 'path';
import type { BudgetData } from './types';

export async function loadSeedData(): Promise<BudgetData> {
  const filePath = path.join(process.cwd(), 'demo', 'seed-data.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const data: BudgetData = JSON.parse(fileContent);
  return data;
}
