import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const institutions = JSON.parse(await readFile(path.join(root, 'scripts/institutions.json'), 'utf8'));
const cache = path.join(root, '.cache/institution-discovery');
await mkdir(cache, { recursive: true });
const original = await Promise.all(['graph', 'attali-wikidata'].map(async name => JSON.parse(await readFile(path.join(root, `src/data/${name}.json`), 'utf8'))));
const known = new Set(original.flatMap(data => data.entities.filter(entity => entity.inCorpus).map(entity => entity.id)));
const discoveries = [];
for (const institution of institutions) {
  if (!/^Q\d+$/.test(institution.id) || institution.properties.some(property => !['P69', 'P108', 'P463'].includes(property))) throw new Error('Configuration institutionnelle invalide.');
  const query = `SELECT DISTINCT ?person ?article WHERE {
    VALUES ?property { ${institution.properties.map(property => `wdt:${property}`).join(' ')} }
    ?person ?property wd:${institution.id}; wdt:P31 wd:Q5.
    ${institution.political ? '?person wdt:P27 wd:Q142. FILTER EXISTS { ?person wdt:P102 ?party. }' : ''}
    ?article schema:about ?person; schema:isPartOf <https://fr.wikipedia.org/>.
  } ORDER BY ?person LIMIT ${institution.limit + 1}`;
  const sourceUrl = `https://query.wikidata.org/sparql?${new URLSearchParams({ query, format: 'json' })}`;
  const cacheFile = path.join(cache, `${institution.id}.json`);
  let result;
  if (process.argv.includes('--cached')) result = JSON.parse(await readFile(cacheFile, 'utf8'));
  else {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'Civigraph/0.1 (https://github.com/JarJarBinLifting/civigraph)', Accept: 'application/sparql-results+json' }, signal: AbortSignal.timeout(45000) });
      if (response.status === 429 || response.status >= 500) { await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1500)); continue; }
      if (!response.ok) throw new Error(`Recherche ${institution.label} : HTTP ${response.status}`);
      result = await response.json();
      break;
    }
    if (!result) throw new Error(`Recherche ${institution.label} indisponible ; sélection précédente préservée.`);
    await writeFile(cacheFile, JSON.stringify(result));
  }
  const bindings = result.results.bindings;
  const selected = bindings.slice(0, institution.limit).map(binding => ({ id: binding.person.value.split('/').pop(), article: binding.article.value }));
  if (selected.some(person => !/^Q\d+$/.test(person.id))) throw new Error('Identifiant découvert invalide.');
  discoveries.push({ ...institution, sourceUrl, query, capped: bindings.length > institution.limit, selected });
  console.log(`${institution.label} : ${selected.length} profils${bindings.length > institution.limit ? ' (plafond atteint)' : ''}`);
}
const ids = [...new Set(discoveries.flatMap(discovery => discovery.selected.map(person => person.id)))].filter(id => !known.has(id)).sort();
if (!ids.length) throw new Error('Aucun profil supplémentaire découvert.');
const manifest = { fetchedAt: new Date().toISOString(), source: 'Wikidata Query Service', description: 'Sélection bornée de profils avec une notice française. Pour les formations : citoyenneté française et affiliation politique renseignées. Ordre des QID, sans classement de personnes.', peopleCount: ids.length, institutions: discoveries };
for (const [relative, value] of [['scripts/people-network.json', ids], ['src/data/network-discovery.json', manifest]]) {
  const file = path.join(root, relative);
  await writeFile(`${file}.tmp`, JSON.stringify(value, null, 2) + '\n');
  await rename(`${file}.tmp`, file);
}
console.log(`${ids.length} nouvelles personnes retenues.`);
