import { loadSeedData } from '@/lib/data-loader';
import V4DemoApp from '@/components/V4DemoApp';

export default async function LedgerPage() {
  return <V4DemoApp seed={await loadSeedData()} screen="ledger" />;
}
