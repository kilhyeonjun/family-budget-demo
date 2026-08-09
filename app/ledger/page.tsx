import { loadSeedData } from '@/lib/data-loader';
import DemoLedgerApp from '@/components/DemoLedgerApp';

export default async function LedgerPage() {
  const data = await loadSeedData();
  return <DemoLedgerApp seed={data} />;
}
