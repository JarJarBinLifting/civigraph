import fs from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { assemblyEntity, assemblyRelation, ASSEMBLY_ARCHIVE, list } from './lib/assembly.mjs';
import { corpusAndRaw, externalIds, snapshot, writeJson } from './lib/import-utils.mjs';

const checkedAt = new Date().toISOString();
const path = '.cache/assembly/historique.json.zip';
await fs.mkdir('.cache/assembly', { recursive: true });
if (!process.argv.includes('--cached')) {
  const response = await fetch(ASSEMBLY_ARCHIVE, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Assemblée nationale : HTTP ${response.status}`);
  await fs.writeFile(path, new Uint8Array(await response.arrayBuffer()));
}
const { raw } = await corpusAndRaw();
const identifiers = externalIds(raw, 'P4123');
const paths = new Map([...identifiers].map(([id, qid]) => [`json/acteur/PA${id}.json`, qid]));
const files = unzipSync(new Uint8Array(await fs.readFile(path)), { filter: file => paths.has(file.name) || /^json\/organe\/PO\d+\.json$/.test(file.name) });
const entities = new Map();
const relations = [];
const missing = [];
const rejected = [];
const matched = [];
for (const [path, qid] of paths) {
  if (!files[path]) { missing.push({ person: qid, path }); continue; }
  const actor = JSON.parse(strFromU8(files[path])).acteur;
  matched.push({ person: qid, actor: path.split('/').at(-1).replace('.json', ''), property: 'P4123' });
  for (const mandate of list(actor.mandats?.mandat)) for (const organId of list(mandate.organes?.organeRef)) {
    let relation;
    try { relation = assemblyRelation(mandate, qid, organId, checkedAt); }
    catch (error) { rejected.push({ person: qid, mandate: mandate.uid, reason: error.message, start: mandate.dateDebut, end: mandate.dateFin }); continue; }
    if (!relation) continue;
    const organBytes = files[`json/organe/${organId}.json`];
    if (!organBytes) throw new Error(`Organe absent : ${organId}`);
    entities.set(relation.target, assemblyEntity(JSON.parse(strFromU8(organBytes)).organe, checkedAt));
    relations.push(relation);
  }
}
const data = snapshot('Assemblée nationale', 'Licence ouverte 2.0', checkedAt, [...entities.values()], relations, 'Mandats nationaux, commissions, missions, délégations et groupes des personnes du corpus. Rapprochement par identifiant Assemblée nationale P4123 ; rattachements financiers à des partis exclus.');
await writeJson('src/data/assembly.json', data);
await writeJson('src/data/assembly-import.json', { checkedAt, source: ASSEMBLY_ARCHIVE, matching: 'Wikidata P4123 → acteur PA', matched, missing, rejected });
console.log({ ...data.meta, peopleMatched: matched.length, identifiersMissingFromArchive: missing.length, rejected: rejected.length });
