import { Explorer } from '@/components/Explorer';
import { loadDataset } from '@/lib/dataset';
import { parseView } from '@/lib/graph';
import { homeMetadata, websiteStructuredData } from '@/lib/publication';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props) {
  return homeMetadata(Object.keys(await searchParams).length > 0);
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => typeof value === 'string' ? [[key, value]] : []));
  const data = loadDataset();
  const structuredData = Object.keys(params).length === 0 ? websiteStructuredData() : null;
  return <>
    {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />}
    <Explorer data={data} initialView={parseView(query.toString(), data)} initialDetailOpen={query.has('selected') || query.has('edge')} />
  </>;
}
