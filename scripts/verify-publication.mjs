// Checks the built server locally. example.org is a reserved test fixture, never a deployment.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const port = 4301;
const origin = `http://127.0.0.1:${port}`;
const fixture = 'https://example.org';
try {
  await fetch(origin, { signal: AbortSignal.timeout(500) });
  throw new Error(`Le port ${port} est occupé. Libérez ce port de test sans arrêter un processus inconnu.`);
} catch (error) {
  if (error.message.includes('occupé')) throw error;
}
let logs = '';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, CIVIGRAPH_INDEXING: 'true', CIVIGRAPH_SITE_URL: fixture, VERCEL_ENV: 'production', CONTEXT: 'production' },
});
server.stdout.on('data', data => { logs += data; });
server.stderr.on('data', data => { logs += data; });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Le serveur de test a quitté : ${logs}`);
    try { if ((await fetch(`${origin}/robots.txt`)).ok) { ready = true; break; } } catch { /* Wait for our own process. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, 'Le serveur de test ne répond pas.');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ javaScriptEnabled: false });
  const remoteRequests = [];
  page.on('request', request => { if (!request.url().startsWith(`${origin}/`)) remoteRequests.push(request.url()); });
  for (const path of ['/', '/entite/Q3052772', '/methode']) {
    assert.equal((await page.goto(`${origin}${path}`)).status(), 200);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'index, follow');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${fixture}${path}`);
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), `${fixture}${path}`);
    assert(await page.locator('h1').innerText());
  }
  await page.goto(`${origin}/?root=Q3052772&compare=Q3579995&comparisonMode=paths`);
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
  assert.equal(await page.locator('link[rel="canonical"]').count(), 0);
  const missing = await page.goto(`${origin}/entite/inconnue`);
  assert.equal(missing.status(), 404);
  assert.match((await page.locator('meta[name="robots"]').allTextContents()).join('') || await page.content(), /noindex/);
  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert(urls.length > 1);
  assert(urls.includes(`${fixture}/`));
  assert(urls.every(url => url.startsWith(`${fixture}/entite/`) || url === `${fixture}/methode` || url === `${fixture}/`));
  assert(urls.every(url => !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('?')));
  assert.equal(new Set(urls).size, urls.length);
  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  assert(robots.includes(`Sitemap: ${fixture}/sitemap.xml`) && robots.includes('Allow: /') && !robots.includes('Disallow: /'));
  assert.equal(remoteRequests.length, 0);
  console.log(JSON.stringify({ fixture, documentaryPages: 2, indexing: 'index, follow', graph: 'noindex', unknownEntity: 404, sitemapEntries: urls.length, remoteRequests: remoteRequests.length }, null, 2));
} finally {
  await browser?.close();
  server.kill(); // Only the process created above; the application on port 4300 remains running.
}
