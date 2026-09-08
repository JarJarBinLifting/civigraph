import type { MetadataRoute } from 'next';
import { publicationRobots } from '@/lib/publication';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  return publicationRobots();
}
