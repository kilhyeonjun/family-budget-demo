import { loadSeedData } from '@/lib/data-loader';
import DemoBudgetApp from '@/components/DemoBudgetApp';

export default async function HomePage() {
  const data = await loadSeedData();
  return <DemoBudgetApp seed={data} />;
}
