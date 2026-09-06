import { Explorer } from '@/components/Explorer';
import { loadDataset } from '@/lib/dataset';
import { parseView } from '@/lib/graph';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => typeof value === 'string' ? [[key, value]] : []));
  const data = loadDataset();
  return <Explorer data={data} initialView={parseView(query.toString(), data)} />;
}
