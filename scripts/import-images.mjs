// Optional, resumable import. Runtime navigation never calls Wikidata or Commons.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { readJson, writeJson } from './lib/import-utils.mjs';
import { imageLicense } from './lib/image-license.mjs';

const cachedOnly = process.argv.includes('--cached'), refresh = process.argv.includes('--refresh');
const expansion = process.argv.includes('--expansion');
const snapshotName = expansion ? 'expansion-images' : 'entity-images';
const limit = Number(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] ?? Infinity);
if (!(limit > 0)) throw new Error('La limite doit être positive.');
const cachePath = '.cache/entity-images';
await mkdir(cachePath, { recursive: true });
await mkdir('public/images/entities', { recursive: true });
async function cachedJson(file, fallback = {}) { try { return await readJson(file); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } }
const publicClaims = await cachedJson(`${cachePath}/wikidata.json`);
const commons = await cachedJson(`${cachePath}/commons.json`);
const previous = await cachedJson(`${cachePath}/progress.json`, { images: [] });
const images = new Map(previous.images.map(image => [image.entityId, image]));
const headers = { 'User-Agent': 'CivigraphV0/0.1 (https://github.com/JarJarBinLifting/civigraph)' };
async function dimensions(bytes) {
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new Error('Image fixe ou dimensions non vérifiables.');
  return metadata.orientation >= 5 ? { width: metadata.height, height: metadata.width } : { width: metadata.width, height: metadata.height };
}
async function publicFetch(input, maxBytes = 20_000_000) {
  if (cachedOnly) throw new Error('Ressource absente du cache ; aucun appel réseau en mode --cached.');
  let url = new URL(input);
  for (let step = 0; step < 7; step++) {
    if (url.protocol !== 'https:' || !['www.wikidata.org', 'commons.wikimedia.org', 'upload.wikimedia.org', 'thumb.wikimedia.org'].includes(url.hostname) || url.username || url.password) throw new Error('Hôte hors des sources publiques Wikimedia.');
    const response = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(25000) });
    if (response.status >= 300 && response.status < 400) { url = new URL(response.headers.get('location'), url); continue; }
    if (response.status === 429 || response.status >= 500) { await new Promise(resolve => setTimeout(resolve, Math.min(4000, 500 * (step + 1)))); continue; }
    if (!response.ok) throw new Error(`Wikimedia HTTP ${response.status}`);
    if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Ressource trop volumineuse.');
    const reader = response.body.getReader(), chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length; if (size > maxBytes) { await reader.cancel(); throw new Error('Ressource trop volumineuse.'); }
      chunks.push(Buffer.from(value));
    }
    return { bytes: Buffer.concat(chunks), mime: response.headers.get('content-type')?.split(';')[0] };
  }
  throw new Error('Wikimedia temporairement indisponible.');
}
async function api(origin, params) {
  const url = `${origin}/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`;
  const result = JSON.parse((await publicFetch(url)).bytes.toString('utf8'));
  if (result.error) throw new Error(`API Wikimedia : ${result.error.code}`);
  return result;
}
const entities = new Map(), raw = new Map();
for (const name of (expansion ? ['expansion-wikidata'] : ['integrity-watch', 'assembly', 'network-wikidata', 'attali-wikidata', 'graph'])) {
  for (const entity of (await readJson(`src/data/${name}.json`)).entities) entities.set(entity.id, { ...entity, inCorpus: entity.inCorpus || entities.get(entity.id)?.inCorpus });
}
for (const folder of (expansion ? ['wikidata-expansion'] : ['wikidata-network', 'wikidata-attali', 'wikidata'])) for (const entity of await readJson(`.cache/${folder}/raw-entities.json`)) raw.set(entity.id, entity);
const overrides = await readJson('scripts/image-overrides.json');
const candidates = [...entities.values()].filter(entity => (!expansion || entity.inCorpus) && /^Q\d+$/.test(entity.id) && entity.wikidataUrl === `https://www.wikidata.org/wiki/${entity.id}` && entity.type !== 'office' && (overrides[entity.id] || ['P18', ...(entity.type === 'person' ? [] : ['P154'])].some(property => raw.get(entity.id)?.claims?.[property]?.some(claim => claim.rank !== 'deprecated' && typeof claim.mainsnak?.datavalue?.value === 'string'))))
  .sort((a, b) => Number(Boolean(overrides[b.id])) - Number(Boolean(overrides[a.id])) || Number(Boolean(b.inCorpus)) - Number(Boolean(a.inCorpus)) || a.id.localeCompare(b.id)).slice(0, limit);

// Confirm the association against public Wikidata before sending a file title to Commons.
const unchecked = candidates.filter(entity => !publicClaims[entity.id] || refresh);
for (let offset = 0; offset < unchecked.length; offset += 50) {
  if (cachedOnly) break;
  const result = await api('https://www.wikidata.org', { action: 'wbgetentities', ids: unchecked.slice(offset, offset + 50).map(entity => entity.id).join('|'), props: 'claims' });
  for (const item of Object.values(result.entities ?? {})) {
    const files = ['P18', 'P154'].flatMap(property => (item.claims?.[property] ?? []).filter(claim => claim.rank !== 'deprecated' && typeof claim.mainsnak?.datavalue?.value === 'string').sort((a, b) => Number(b.rank === 'preferred') - Number(a.rank === 'preferred')).map(claim => ({ property, file: claim.mainsnak.datavalue.value, statement: claim.id })));
    publicClaims[item.id] = { files, revision: item.lastrevid ?? null, checkedAt: new Date().toISOString() };
  }
  await writeJson(`${cachePath}/wikidata.json`, publicClaims);
  console.log(`Identités publiques vérifiées : ${Math.min(offset + 50, unchecked.length)}/${unchecked.length}`);
}
const selected = candidates.map(entity => ({ entity, selection: overrides[entity.id] ? { ...overrides[entity.id], property: 'reviewed:commons' } : publicClaims[entity.id]?.files.find(item => item.property === 'P18' || entity.type !== 'person') })).filter(item => item.selection);
const titles = [...new Set(selected.map(item => `File:${item.selection.file}`))].filter(title => !commons[title] || refresh);
for (let offset = 0; offset < titles.length; offset += 20) {
  if (cachedOnly) break;
  const chunk = titles.slice(offset, offset + 20);
  const result = await api('https://commons.wikimedia.org', { action: 'query', prop: 'imageinfo', iiprop: 'url|extmetadata|sha1|size|mime', iiurlwidth: '320', iiurlheight: '420', redirects: '1', formatversion: '2', titles: chunk.join('|') });
  const aliases = new Map([...(result.query?.normalized ?? []), ...(result.query?.redirects ?? [])].map(item => [item.from, item.to]));
  const pages = new Map((result.query?.pages ?? []).map(page => [page.title, page]));
  for (const original of chunk) {
    let title = original; for (let i = 0; i < 5 && aliases.has(title); i++) title = aliases.get(title);
    const page = pages.get(title);
    commons[original] = { title, pageId: page?.pageid, info: page?.imageinfo?.[0] ?? null, checkedAt: new Date().toISOString() };
  }
  await writeJson(`${cachePath}/commons.json`, commons);
  console.log(`Licences Commons lues : ${Math.min(offset + 20, titles.length)}/${titles.length}`);
}
const skipped = [], included = [];
for (let offset = 0; offset < selected.length; offset += 3) {
  await Promise.all(selected.slice(offset, offset + 3).map(async ({ entity, selection }) => {
    const cached = commons[`File:${selection.file}`], info = cached?.info, license = imageLicense(info);
    if (!license) { skipped.push({ entityId: entity.id, file: selection.file, reason: 'Licence, attribution ou statut non retenu par le contrôle automatique.' }); return; }
    try {
      const existing = images.get(entity.id);
      if (existing?.sourceSha1 === info.sha1 && existing.sourceTitle === cached.title) {
        const bytes = await readFile(`public${existing.src}`);
        if (createHash('sha256').update(bytes).digest('hex') === existing.sha256) { const verified = { ...existing, ...license, ...await dimensions(bytes) }; images.set(entity.id, verified); included.push(verified); return; }
      }
      const imageUrl = new URL(info.thumburl ?? info.url); imageUrl.search = '';
      const { bytes, mime } = await publicFetch(imageUrl, 2_000_000);
      const extension = mime === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 ? 'jpg' : mime === 'image/png' && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' ? 'png' : mime === 'image/webp' && bytes.subarray(8, 12).toString() === 'WEBP' ? 'webp' : null;
      if (!extension) throw new Error('Format raster non retenu.');
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const src = `/images/entities/${entity.id}-${sha256.slice(0, 12)}.${extension}`;
      await writeFile(`public${src}`, bytes);
      const image = { entityId: entity.id, src, ...await dimensions(bytes), ...license, sourceTitle: cached.title, sourceSha1: info.sha1, sha256, bytes: bytes.length, associationSource: selection.source ?? `${entity.wikidataUrl}#${selection.property}`, checkedAt: cached.checkedAt };
      images.set(entity.id, image); included.push(image);
    } catch (error) { skipped.push({ entityId: entity.id, file: selection.file, reason: error.message }); }
  }));
  if (offset % 30 === 0 || offset + 3 >= selected.length) {
    await writeJson(`${cachePath}/progress.json`, { images: [...images.values()] });
    await writeJson(`src/data/${snapshotName}.json`, { version: 1, checkedAt: new Date().toISOString(), images: included.sort((a, b) => a.entityId.localeCompare(b.entityId)) });
    console.log(`Images locales : ${included.length} ; non importées : ${skipped.length} ; traitées : ${Math.min(offset + 3, selected.length)}/${selected.length}`);
  }
}
const people = included.filter(image => entities.get(image.entityId)?.type === 'person').length;
await writeJson(`src/data/${snapshotName}-manifest.json`, { version: 1, checkedAt: new Date().toISOString(), candidates: candidates.length, imported: included.length, people, other: included.length - people, bytes: included.reduce((sum, image) => sum + image.bytes, 0), skipped: skipped.sort((a, b) => a.entityId.localeCompare(b.entityId)) });
console.log(JSON.stringify({ candidates: candidates.length, imported: included.length, people, other: included.length - people, skipped: skipped.length }));
