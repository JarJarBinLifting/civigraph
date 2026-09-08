import fs from 'node:fs/promises';
export const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
export async function writeJson(path, value) {
  // Validation happens before a single atomic replacement of the committed snapshot.
  await fs.writeFile(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n');
  await fs.rename(`${path}.tmp`, path);
}
export async function corpusAndRaw() {
  const names = ['graph', 'attali-wikidata', 'network-wikidata', 'current-wikidata'];
  const entities = new Map();
  for (const name of names) for (const entity of (await readJson(`src/data/${name}.json`)).entities) if (entity.inCorpus) entities.set(entity.id, entity);
  const raw = new Map();
  for (const folder of ['wikidata', 'wikidata-attali', 'wikidata-network', 'wikidata-current']) for (const entity of await readJson(`.cache/${folder}/raw-entities.json`)) if (entities.has(entity.id)) raw.set(entity.id, entity);
  return { entities, raw };
}
export function externalIds(raw, property) {
  const result = new Map();
  for (const entity of raw.values()) for (const claim of entity.claims[property] ?? []) {
    if (claim.rank === 'deprecated') continue;
    const value = claim.mainsnak.datavalue?.value;
    if (typeof value !== 'string') continue;
    if (result.has(value) && result.get(value) !== entity.id) throw new Error(`Identifiant ambigu ${property}:${value}`);
    result.set(value, entity.id);
  }
  return result;
}
export function snapshot(source, license, checkedAt, entities, relations, description) {
  if (new Set(relations.map(r => r.id)).size !== relations.length) throw new Error('Déclarations dupliquées');
  return { meta: { version: 1, fetchedAt: checkedAt, source, license, peopleCount: entities.filter(e => e.inCorpus).length, entityCount: entities.length, relationCount: relations.length, properties: [...new Set(relations.map(r => r.property))], description }, entities, relations };
}
