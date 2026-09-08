import assert from 'node:assert/strict';

const origin = process.argv[2] ?? 'http://127.0.0.1:8787';
const canonical = 'https://civigraph.org';
const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
async function read(path, status = 200) {
  const response = await fetch(`${origin}${path}`, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, status, `${path}: HTTP status`);
  assert(!response.headers.get('x-robots-tag')?.includes('noindex') || status === 404, `${path}: restrictive HTTP header`);
  return response.text();
}
function meta(html, name) {
  return html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`))?.[1];
}
for (const path of ['/', '/methode', '/entite/Q3052772', '/entite/Q859363']) {
  const html = await read(path);
  assert.equal(meta(html, 'robots'), 'index, follow', `${path}: indexability`);
  assert(html.includes(`<link rel="canonical" href="${canonical}${path}"`), `${path}: canonical`);
  assert.equal(meta(html, 'og:url'), `${canonical}${path}`);
  assert(meta(html, 'description')?.length > 30, `${path}: description`);
  assert.match(html, /<h1[ >]/, `${path}: server-rendered heading`);
  if (path === '/') {
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1]);
    assert.equal(data['@type'], 'WebSite');
    assert.equal(data.url, `${canonical}/`);
  }
}
for (const query of ['?root=Q3052772&selected=Q859363', '?compare=Q3579995&comparisonMode=paths', '?root=Q3052772&root=Q859363']) {
  const html = await read(`/${query}`);
  assert.equal(meta(html, 'robots'), 'noindex, follow');
  assert(!html.includes('<link rel="canonical"'));
}
const missing = await read('/entite/does-not-exist', 404);
assert(missing.includes('noindex'));
const robots = await read('/robots.txt');
assert(robots.includes('Allow: /') && !robots.includes('Disallow: /'));
assert(robots.includes(`Sitemap: ${canonical}/sitemap.xml`));
const sitemap = await read('/sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert(urls.includes(`${canonical}/`) && urls.includes(`${canonical}/methode`));
assert.equal(new Set(urls).size, urls.length);
assert(urls.every(url => url.startsWith(`${canonical}/`) && !url.includes('?') && !url.includes('#')));
assert(urls.length > 1000);
console.log(JSON.stringify({ origin, indexablePagesChecked: 4, filteredViewsChecked: 3, unknownEntity: 404, sitemapEntries: urls.length, websiteSchema: 'valid' }, null, 2));
