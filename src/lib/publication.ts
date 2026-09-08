import type { Entity, GraphData } from './types';
import { getGraphIndex } from './graph-index';
import { supportsPeriods } from './temporal';
import type { Metadata, MetadataRoute } from 'next';
export interface Publication { enabled: boolean; siteUrl: string | null }
export function publicationConfig(env: Record<string, string | undefined> = process.env): Publication {
  const disabled = { enabled: false, siteUrl: null };
  if (env.CIVIGRAPH_INDEXING !== 'true' || env.NODE_ENV === 'development' || (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') || (env.CONTEXT && env.CONTEXT !== 'production')) return disabled;
  try {
    const url = new URL(env.CIVIGRAPH_SITE_URL ?? '');
    const host = url.hostname;
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) return disabled;
    if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)) return disabled;
    if (!host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return disabled;
    return { enabled: true, siteUrl: url.origin };
  } catch { return disabled; }
}
export function entityPath(id: string) { return `/entite/${encodeURIComponent(id)}`; }
export function eligibleEntity(entity: Entity, data: GraphData) {
  return Boolean(entity.label !== entity.id && (entity.wikidataUrl || entity.sourceUrl) && (entity.type === 'person' ? entity.inCorpus : supportsPeriods(entity)) && getGraphIndex(data).incident.get(entity.id)?.length);
}
export function documentarySitemap(data: GraphData, config: Publication): { url: string; lastModified: string }[] {
  if (!config.enabled || !config.siteUrl) return [];
  const lastModified = data.meta.supplementedAt ?? data.meta.fetchedAt;
  return [{ url: `${config.siteUrl}/`, lastModified }, { url: `${config.siteUrl}/methode`, lastModified }, ...data.entities.filter(entity => eligibleEntity(entity, data)).map(entity => ({ url: `${config.siteUrl}${entityPath(entity.id)}`, lastModified }))];
}
export function publicationRobots(): MetadataRoute.Robots {
  const config = publicationConfig();
  // Crawlers must fetch scripts, images and filtered pages to see their noindex metadata.
  return config.enabled ? { rules: { userAgent: '*', allow: '/' }, sitemap: `${config.siteUrl}/sitemap.xml` } : { rules: { userAgent: '*', disallow: '/' } };
}
export const homeDescription = 'Explorez les parcours politiques, formations, fonctions et organisations de la vie publique française. Consultez les périodes et les sources de chaque lien.';
export function homeMetadata(hasQuery: boolean): Metadata {
  const config = publicationConfig();
  const metadata = documentMetadata('Parcours et réseaux de la vie publique française', homeDescription, '/', !hasQuery);
  return { ...metadata, title: 'Civigraph — Parcours et réseaux de la vie publique française', robots: { index: config.enabled && !hasQuery, follow: config.enabled } };
}
export function websiteStructuredData() {
  const config = publicationConfig();
  if (!config.enabled || !config.siteUrl) return null;
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${config.siteUrl}/#website`, name: 'Civigraph', url: `${config.siteUrl}/`, description: homeDescription, inLanguage: 'fr-FR' };
}
export function documentMetadata(title: string, description: string, path: string, eligible = true): Metadata {
  const config = publicationConfig();
  const enabled = config.enabled && eligible;
  return { title: `${title} — Civigraph`, description, robots: { index: enabled, follow: enabled },
    ...(enabled ? { alternates: { canonical: `${config.siteUrl}${path}` }, openGraph: { title, description, url: `${config.siteUrl}${path}`, siteName: 'Civigraph', locale: 'fr_FR', type: 'website' as const } } : {}),
  };
}
