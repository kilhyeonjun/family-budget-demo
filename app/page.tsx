import { loadSeedData } from '@/lib/data-loader';
import V4DemoApp from '@/components/V4DemoApp';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  return <V4DemoApp seed={await loadSeedData()} editId={edit ?? null} />;
}
