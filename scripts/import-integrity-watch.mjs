import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { corpusAndRaw, externalIds, readJson, snapshot, writeJson } from './lib/import-utils.mjs';
import { integrityRelations, normalizeLabel, declarationDate } from './lib/integrity-watch.mjs';

const checkedAt = new Date().toISOString();
const folder = '.cache/integrity-watch';
const base = 'https://integritywatch.fr/autoupdate_data_fr/mps/';
await fs.mkdir(folder, { recursive: true });
const cached = process.argv.includes('--cached');
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`Integrity Watch / HATVP : HTTP ${response.status} · ${url}`);
  return response.text();
}
if (!cached) {
  const backups = JSON.parse(await download(`${base}backups.json`));
  const active = backups.find(item => item.active);
  if (!active) throw new Error('Export actif introuvable');
  const directory = active.type === 'default' ? 'latest' : active.timestamp;
  const files = [];
  for (const name of ['declarations.json', 'peopleList.json']) {
    const url = `${base}${directory}/declarations/${name}`;
    const text = await download(url);
    JSON.parse(text);
    await fs.writeFile(`${folder}/${name}`, text);
    files.push({ url, name, sha256: createHash('sha256').update(text).digest('hex') });
  }
  const after = JSON.parse(await download(`${base}backups.json`)).find(item => item.active);
  if (after?.timestamp !== active.timestamp) throw new Error('Export modifié pendant le téléchargement ; relancer.');
  await writeJson(`${folder}/manifest.json`, { checkedAt, snapshot: active.timestamp, files });
}
const manifest = await readJson(`${folder}/manifest.json`);
const people = await readJson(`${folder}/peopleList.json`);
const declarations = await readJson(`${folder}/declarations.json`);
const { raw } = await corpusAndRaw();
const identifiers = externalIds(raw, 'P4703');
const rules = await readJson('scripts/organization-aliases.json');
const aliases = new Map(rules.organizations.flatMap(org => org.aliases.map(label => [normalizeLabel(label), org.id])));
const allEntities = new Set();
for (const name of ['graph', 'attali-wikidata', 'network-wikidata', 'current-wikidata', 'assembly']) for (const entity of (await readJson(`src/data/${name}.json`)).entities) allEntities.add(entity.id);
for (const id of aliases.values()) if (!allEntities.has(id)) throw new Error(`Entité de rapprochement absente : ${id}`);
const relations = new Map();
const matched = [];
const skipped = [];
const unmatchedOrganizations = new Map();
for (const person of people) {
  const info = person.declarations.find(info => info.date_depot === person.latest_dec_timestamp && info.nom_fichier && /-(?:dia|diam|di|dim)\d+-/.test(info.nom_fichier));
  if (!info) continue;
  const hatvpId = info.nom_fichier.replace(/-(?:dia|diam|di|dim)\d+-.+$/, '');
  const qid = identifiers.get(hatvpId);
  if (!qid) continue;
  if (!/^[a-z0-9-]+$/.test(info.nom_fichier)) { skipped.push({ person: qid, hatvpId, reason: 'Nom de fichier HATVP invalide' }); continue; }
  // The explicit HATVP ID joins the published index to Wikidata. Name, deposit timestamp
  // and birth date independently guard the link from that index to the declaration body.
  const candidates = declarations.filter(item => normalizeLabel(item.general.declarant.nom) === normalizeLabel(person.nom) && normalizeLabel(item.general.declarant.prenom) === normalizeLabel(person.prenom) && item.dateDepot === info.date_depot);
  const declaration = candidates.length === 1 ? candidates[0] : null;
  const birth = declarationDate(declaration?.general.declarant.dateNaissance)?.value;
  const wikidataBirths = (raw.get(qid).claims.P569 ?? []).filter(claim => claim.rank !== 'deprecated').map(claim => claim.mainsnak.datavalue?.value).filter(value => value?.precision === 11).map(value => value.time.slice(1, 11));
  if (!declaration || ![true, 'true'].includes(declaration.complete) || !birth || !wikidataBirths.includes(birth)) { skipped.push({ person: qid, hatvpId, reason: 'Déclaration complète, identité ou date de naissance non confirmée' }); continue; }
  const xmlPath = `${folder}/${info.nom_fichier}.xml`;
  let xml;
  try { xml = cached ? await fs.readFile(xmlPath, 'utf8') : await download(`https://www.hatvp.fr/livraison/dossiers/${info.nom_fichier}.xml`); }
  catch (error) { skipped.push({ person: qid, hatvpId, reason: error.message }); continue; }
  if (!xml.includes(declaration.uuid)) { skipped.push({ person: qid, hatvpId, reason: 'UUID absent du document original HATVP' }); continue; }
  if (!cached) await fs.writeFile(xmlPath, xml);
  const result = integrityRelations(declaration, qid, aliases, { file: info.nom_fichier, publishedAt: info.date_publication, snapshot: manifest.snapshot, checkedAt });
  for (const relation of result.relations) relations.set(relation.id, relation);
  for (const name of result.unmatched) unmatchedOrganizations.set(name, (unmatchedOrganizations.get(name) ?? 0) + 1);
  matched.push({ person: qid, hatvpId, declaration: declaration.uuid, file: info.nom_fichier, property: 'P4703', relations: result.relations.length, originalSha256: createHash('sha256').update(xml).digest('hex') });
}
const data = snapshot('HATVP via Integrity Watch France', 'Données HATVP : licence ouverte Etalab', checkedAt, [], [...relations.values()], 'Dernières déclarations complètes présentes dans l’export, personnes rapprochées par P4703 et organismes explicitement identifiés. Activités professionnelles et organes dirigeants uniquement.');
await writeJson('src/data/integrity-watch.json', data);
await writeJson('src/data/integrity-watch-import.json', { ...manifest, importedAt: checkedAt, matching: 'P4703 + contrôle nom, prénom, date de naissance et UUID original HATVP', matched, skipped, unmatchedOrganizations: [...unmatchedOrganizations].map(([label, people]) => ({ label, people })) });
console.log({ ...data.meta, snapshot: manifest.snapshot, peopleMatched: matched.length, skipped: skipped.length, unmatchedOrganizationLabels: unmatchedOrganizations.size });
