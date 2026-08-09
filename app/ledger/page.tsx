import { loadSeedData } from '@/lib/data-loader';
import { BudgetService } from '@/lib/budget-service';
import LedgerView from '@/components/LedgerView';

export default async function LedgerPage() {
  const data = await loadSeedData();
  const service = new BudgetService(data);
  const transactions = service.getTransactions();

  return <LedgerView transactions={transactions} />;
}
