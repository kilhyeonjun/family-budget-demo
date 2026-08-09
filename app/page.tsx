import { loadSeedData } from '@/lib/data-loader';
import { BudgetService } from '@/lib/budget-service';
import DashboardView from '@/components/DashboardView';

export default async function HomePage() {
  const data = await loadSeedData();
  const service = new BudgetService(data);
  const currentMonth = '2026-06';
  const summary = service.getDashboardSummary(currentMonth);
  const recentTransactions = service.getTransactions().slice(0, 5);

  return (
    <DashboardView
      summary={summary}
      recentTransactions={recentTransactions}
      currentMonth={currentMonth}
    />
  );
}
