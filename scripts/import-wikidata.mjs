import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supplement = process.argv.includes('--attali');
const network = process.argv.includes('--network');
const current = process.argv.includes('--current');
if ([supplement, network, current].filter(Boolean).length > 1) throw new Error('Choisir un seul complément à importer.');
const roster = current ? JSON.parse(await readFile(path.join(root, 'scripts/people-2026.json'), 'utf8')) : null;
const titles = current ? roster.people.map(person => person.id) : JSON.parse(await readFile(path.join(root, network ? 'scripts/people-network.json' : supplement ? 'scripts/people-attali.json' : 'scripts/people.json'), 'utf8'));
const cache = path.join(root, current ? '.cache/wikidata-current' : network ? '.cache/wikidata-network' : supplement ? '.cache/wikidata-attali' : '.cache/wikidata');
await mkdir(cache, { recursive: true });
const propertyMap = {
  P69: { category: 'education', label: 'A étudié à', type: 'school' },
  P39: { category: 'office', label: 'A exercé la fonction de', type: 'office' },
  P102: { category: 'party', label: 'A été membre de', type: 'party' },
  P108: { category: 'employment', label: 'A travaillé pour', type: 'organization' },
  P463: { category: 'membership', label: 'A été membre de', type: 'organization' },
};
const fetchedAt = new Date().toISOString();

async function api(params) {
  const query = new URLSearchParams({ action: 'wbgetentities', format: 'json', ...params });
  const url = `https://www.wikidata.org/w/api.php?${query}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CivigraphV0/0.1 (https://github.com/JarJarBinLifting/civigraph)' },
      signal: AbortSignal.timeout(45000),
    });
    if (response.status === 429 || response.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      continue;
    }
    if (!response.ok) throw new Error(`Wikidata HTTP ${response.status}`);
    const result = await response.json();
    if (result.error) throw new Error(JSON.stringify(result.error));
    return Object.values(result.entities);
  }
  throw new Error('Wikidata indisponible après quatre tentatives. Le snapshot existant est préservé.');
}

const people = [];
for (let offset = 0; offset < titles.length; offset += 10) {
  const chunk = titles.slice(offset, offset + 10);
  const result = await api({ ...((network || current) ? { ids: chunk.join('|') } : { sites: 'frwiki', titles: chunk.join('|') }), props: 'info|labels|descriptions|claims|sitelinks', languages: 'fr|en|mul', sitefilter: 'frwiki' });
  if (result.length !== chunk.length || result.some(entity => !entity.id || entity.missing !== undefined)) {
    throw new Error(`Résolution incomplète des personnes : ${chunk.join(', ')}`);
  }
  people.push(...result);
  console.log(`Personnes résolues : ${people.length}/${titles.length}`);
}
const personIds = new Set(people.map(person => person.id));
if (personIds.size !== titles.length || (!supplement && !network && !current && (personIds.size < 30 || personIds.size > 50))) throw new Error('Effectif du corpus incohérent avec la sélection.');
if (current && people.some(person => !(person.claims?.P31 ?? []).some(claim => claim.mainsnak?.datavalue?.value?.id === 'Q5'))) throw new Error('Une identité du socle ne désigne pas une personne.');
const label = entity => entity.labels?.fr?.value || entity.labels?.mul?.value || entity.labels?.en?.value || entity.id;
const targetTypes = new Map();
const rawRelations = [];
for (const person of people) {
  for (const [property, spec] of Object.entries(propertyMap)) {
    for (const claim of person.claims?.[property] ?? []) {
      const target = claim.mainsnak?.datavalue?.value?.id;
      if (claim.rank === 'deprecated' || !target || target === person.id) continue;
      // P108 sometimes names a person: keep the source statement without expanding the curated people corpus.
      if (personIds.has(target)) targetTypes.set(target, 'person');
      else if (!targetTypes.has(target) || spec.type === 'party' || spec.type === 'school') targetTypes.set(target, spec.type);
      rawRelations.push({ person, claim, property, spec, target });
    }
  }
}
function officeContexts(claim) {
  return ['P2389', 'P1001', 'P642'].flatMap(property => (claim.qualifiers?.[property] ?? []).flatMap(snak => {
    const id = snak.datavalue?.value?.id;
    return id ? [{ property, id }] : [];
  }));
}
const contextIds = rawRelations.flatMap(({ property, claim }) => property === 'P39' ? officeContexts(claim).map(context => context.id) : []);
const targetIds = [...new Set([...targetTypes.keys(), ...contextIds])].filter(id => !personIds.has(id));
const targets = [];
for (let offset = 0; offset < targetIds.length; offset += 40) {
  const result = await api({ ids: targetIds.slice(offset, offset + 40).join('|'), props: 'info|labels|descriptions|claims', languages: 'fr|en|mul' });
  if (result.some(entity => entity.missing !== undefined)) throw new Error('Une entité liée est introuvable.');
  targets.push(...result);
  console.log(`Entités liées : ${targets.length}/${targetIds.length}`);
}
const allRaw = [...people, ...targets];
const byId = new Map(allRaw.map(entity => [entity.id, entity]));
function dateValue(snaks) {
  const value = snaks?.[0]?.datavalue?.value;
  return value?.time ? { value: value.time.replace(/^\+/, '').split('T')[0], precision: value.precision } : undefined;
}
function referenceSources(claim) {
  return (claim.references ?? []).map(reference => {
    const urls = (reference.snaks.P854 ?? []).map(snak => snak.datavalue?.value).filter(value => typeof value === 'string' && /^https?:\/\//.test(value));
    const statedIn = (reference.snaks.P248 ?? []).map(snak => snak.datavalue?.value?.id).filter(Boolean);
    const importedFrom = (reference.snaks.P143 ?? []).map(snak => snak.datavalue?.value?.id).filter(Boolean);
    return { id: reference.hash, urls, statedIn, importedFrom, retrieved: dateValue(reference.snaks.P813) };
  });
}
let entities = allRaw.filter(entity => personIds.has(entity.id) || targetTypes.has(entity.id)).map(entity => {
  const isHuman = (entity.claims?.P31 ?? []).some(claim => claim.mainsnak?.datavalue?.value?.id === 'Q5');
  return {
    id: entity.id,
    label: label(entity),
    description: entity.descriptions?.fr?.value || '',
    type: personIds.has(entity.id) || isHuman ? 'person' : targetTypes.get(entity.id),
    inCorpus: personIds.has(entity.id),
    wikidataUrl: `https://www.wikidata.org/wiki/${entity.id}`,
    revision: entity.lastrevid,
    modified: entity.modified,
  };
});
const relations = rawRelations.map(({ person, claim, property, spec, target }) => {
  const contexts = property === 'P39' ? officeContexts(claim).map(context => ({ ...context, label: label(byId.get(context.id)), revision: byId.get(context.id).lastrevid })) : [];
  const contextualTarget = contexts.length ? `${target}@${contexts.map(context => `${context.property}:${context.id}`).sort().join('@')}` : target;
  if (contexts.length && !entities.some(entity => entity.id === contextualTarget)) {
    const original = entities.find(entity => entity.id === target);
    entities.push({ ...original, id: contextualTarget, sourceEntityId: target, label: `${original.label} · ${[...new Set(contexts.map(context => context.label))].join(' · ')}`, contexts });
  }
  return {
  id: claim.id,
  source: person.id,
  target: contextualTarget,
  sourceTarget: target,
  property,
  category: spec.category,
  label: property === 'P102' && target === 'Q327591' ? 'A eu le statut politique' : spec.label,
  start: dateValue(claim.qualifiers?.P580),
  end: dateValue(claim.qualifiers?.P582),
  pointInTime: dateValue(claim.qualifiers?.P585),
  statementUrl: `https://www.wikidata.org/wiki/${person.id}#${claim.id.replace('$', '-')}`,
  revisionUrl: `https://www.wikidata.org/w/index.php?title=${person.id}&oldid=${person.lastrevid}`,
  references: referenceSources(claim),
  ...(contexts.length ? { contexts } : {}),
  };
});
const linkedIds = new Set(relations.flatMap(relation => [relation.source, relation.target]));
entities = entities.filter(entity => linkedIds.has(entity.id) || entity.inCorpus);
const finalIds = new Set(entities.map(entity => entity.id));
if (relations.some(relation => !finalIds.has(relation.source) || !finalIds.has(relation.target))) throw new Error('Relation sans entité.');
if (entities.some(entity => !entity.label || !entity.type || !entity.revision)) throw new Error('Entité sans libellé, type ou révision.');
const data = {
  meta: {
    version: 1, fetchedAt, source: 'Wikidata', license: 'CC0-1.0',
    peopleCount: personIds.size, entityCount: entities.length, relationCount: relations.length,
    properties: Object.keys(propertyMap),
    description: `Corpus exploratoire de ${personIds.size} personnalités${network ? ' découvertes depuis les institutions' : supplement ? ' liées à la commission Attali' : ' de la vie politique française'}. Non exhaustif et non représentatif.`,
  },
  entities, relations,
};
await writeFile(path.join(cache, 'raw-entities.json'), JSON.stringify(allRaw));
const destination = path.join(root, 'src/data');
await mkdir(destination, { recursive: true });
const filename = current ? 'current-wikidata.json' : network ? 'network-wikidata.json' : supplement ? 'attali-wikidata.json' : 'graph.json';
const temporary = path.join(destination, `${filename}.tmp`);
await writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
await rename(temporary, path.join(destination, filename));
console.log(JSON.stringify(data.meta, null, 2));
