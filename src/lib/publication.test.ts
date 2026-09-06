import { expect, test } from 'vitest';
import { documentarySitemap, entityPath, publicationConfig } from './publication';
import { loadDataset } from './dataset';
test('indexing is off by default and rejects local, invalid, credentialed and preview origins', () => {
  expect(publicationConfig({}).enabled).toBe(false);
  for (const url of ['http://example.org', 'https://localhost', 'https://127.0.0.1', 'https://[::1]', 'https://intranet', 'https://example.org/path', 'https://name:secret@example.org', 'https://example.org?q=1']) {
    expect(publicationConfig({ CIVIGRAPH_INDEXING: 'true', CIVIGRAPH_SITE_URL: url }).enabled).toBe(false);
  }
  expect(publicationConfig({ CIVIGRAPH_INDEXING: 'true', CIVIGRAPH_SITE_URL: 'https://example.org', VERCEL_ENV: 'preview' }).enabled).toBe(false);
  expect(publicationConfig({ CIVIGRAPH_INDEXING: 'true', CIVIGRAPH_SITE_URL: 'https://example.org', NODE_ENV: 'development' }).enabled).toBe(false);
});
test('only an explicit public origin enables documentary canonicals and a sitemap', () => {
  // example.org is a test fixture, never a deployment address.
  const config = publicationConfig({ CIVIGRAPH_INDEXING: 'true', CIVIGRAPH_SITE_URL: 'https://example.org/' });
  expect(config).toEqual({ enabled: true, siteUrl: 'https://example.org' });
  const data = loadDataset();
  expect(documentarySitemap(data, { enabled: false, siteUrl: null })).toEqual([]);
  const urls = documentarySitemap(data, config).map(entry => entry.url);
  expect(urls).toContain('https://example.org/entite/Q3052772');
  expect(urls).toContain('https://example.org/methode');
  expect(urls).not.toContain('https://example.org/');
  expect(urls.every(url => !url.includes('?') && !url.includes('localhost') && !url.includes('127.0.0.1'))).toBe(true);
  expect(entityPath('AN:organe:1')).toBe('/entite/AN%3Aorgane%3A1');
});
