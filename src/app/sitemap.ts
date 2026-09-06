import type { MetadataRoute } from 'next';
import { loadDataset } from '@/lib/dataset';
import { documentarySitemap, publicationConfig } from '@/lib/publication';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap { return documentarySitemap(loadDataset(), publicationConfig()); }
