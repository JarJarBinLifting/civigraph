import { readJson, writeJson, snapshot } from './lib/import-utils.mjs';

// Reviewed evidence is explicit input; rebuilding never advances its check date.
const roster = await readJson('scripts/expansion-official-roster.json');
const corpus = await readJson('src/data/expansion-wikidata.json');
const entities = new Map(), relations = [];
for (const person of roster.people) {
  if (!corpus.entities.some(entity => entity.id === person.id && entity.inCorpus && entity.label === person.name)) throw new Error(`Identité non rapprochée : ${person.name}`);
  const europe = person.section === 'europe';
  const url = europe ? roster.europeanDirectory : person.url;
  const institution = europe ? { id: 'Q8889', label: 'Parlement européen' } : { id: 'Q9705', label: 'Sénat français' };
  const roles = [{ entity: institution, category: 'office', label: 'A siégé au', role: person.role ?? 'Membre du Parlement européen élu en France' }];
  if (europe) roles.push({ entity: roster.groups[person.group], category: 'membership', label: 'A siégé dans le groupe', role: 'Membre du groupe parlementaire' });
  for (const { entity, category, label, role } of roles) {
    entities.set(entity.id, { ...entity, description: 'Institution ou groupe parlementaire cité par une source officielle.', type: 'organization', inCorpus: false, modified: roster.checkedAt, sourceUrl: url, sourceLabel: europe ? 'Parlement européen' : 'Sénat' });
    relations.push({
      id: `official:expansion:${person.id}:${entity.id}`, source: person.id, target: entity.id,
      property: 'official:parliamentary-roster', category, label, role,
      pointInTime: { value: roster.checkedAt, precision: 11 }, statementUrl: url,
      references: [{ id: `expansion:${person.id}`, urls: [url], statedIn: [], importedFrom: [] }],
      evidence: { kind: 'official', title: `${institution.label} · ${person.name}`, locator: `${person.name} · ${entity.label}`,
        checkedAt: roster.checkedAt, note: 'Présence dans la source officielle consultée à cette date. Ce repère ne fixe ni le début ni la fin du mandat et ne valide pas les autres éléments du parcours Wikidata.' },
    });
  }
}
await writeJson('src/data/expansion-official.json', snapshot('Parlement européen et Sénat', 'Conditions de chaque source', roster.checkedAt, [...entities.values()], relations, 'Six membres du Parlement européen et deux sénateurs : mandats et groupes européens attestés au 9 septembre 2026. Sélection partielle.'));
console.log(`${roster.people.length} personnes ; ${relations.length} attestations officielles.`);
