import { Explorer } from '@/components/Explorer';
import dataset from '@/data/graph.json';
import type { GraphData } from '@/lib/types';
import { parseView } from '@/lib/graph';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => typeof value === 'string' ? [[key, value]] : []));
  const data = dataset as GraphData;
  return <Explorer data={data} initialView={parseView(query.toString(), data)} />;
}
