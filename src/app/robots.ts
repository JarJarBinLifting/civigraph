import type { MetadataRoute } from 'next';
import { publicationConfig } from '@/lib/publication';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  const config = publicationConfig();
  return config.enabled ? { rules: { userAgent: '*', allow: ['/entite/', '/methode'], disallow: '/' }, sitemap: `${config.siteUrl}/sitemap.xml` } : { rules: { userAgent: '*', disallow: '/' } };
}
