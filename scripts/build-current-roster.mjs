import { createHash } from 'node:crypto';
import { readJson, writeJson, snapshot } from './lib/import-utils.mjs';

// The reviewed roster is editorial input. Rebuilding it never reinterprets an
// undated historic mandate as a current office, or silently resolves a name.
const roster = await readJson('scripts/people-2026.json');
const wikidata = await readJson('src/data/current-wikidata.json');
const imported = new Map(wikidata.entities.map(entity => [entity.id, entity]));
const organizations = new Map();
const relations = [];
const slug = value => createHash('sha256').update(value).digest('hex').slice(0, 16);
if (new Set(roster.people.map(person => person.id)).size !== roster.people.length) throw new Error('Identités dupliquées');
for (const person of roster.people) {
  if (!imported.get(person.id)?.inCorpus || imported.get(person.id)?.type !== 'person') throw new Error(`Identité absente : ${person.name}`);
  for (const role of person.roles) {
    if (new URL(role.url).protocol !== 'https:') throw new Error('Source HTTPS requise');
    const id = role.organizationId ?? `current:organization:${slug(role.organization)}`;
    const category = role.section === 'parties' || role.section.endsWith('-groups') ? 'party' : 'office';
    organizations.set(id, imported.get(id) ?? {
      id, label: role.organization, description: 'Organisation citée dans le socle national vérifié en 2026.',
      type: category === 'party' ? 'party' : 'organization', inCorpus: false,
      modified: roster.checkedAt, sourceUrl: role.url, sourceLabel: 'Source du socle 2026',
    });
    relations.push({
      id: `official:2026:${person.id}:${slug(`${id}:${role.role}`)}`, source: person.id, target: id,
      category, property: 'official:2026-role', label: 'A exercé une responsabilité dans', role: role.role,
      pointInTime: { value: roster.checkedAt, precision: 11 }, statementUrl: role.url,
      references: [{ id: `roster-2026:${person.id}`, urls: [role.url], statedIn: [], importedFrom: [] }],
      evidence: { kind: 'official', title: `${role.organization} · ${person.name}`, locator: `${person.name} · ${role.role}`,
        checkedAt: roster.checkedAt, note: 'Fonction présentée par la source consultée à cette date. Ce repère ne précise pas le début ou la fin du mandat. La source de sélection ne valide pas tous les autres éléments du parcours Wikidata.' },
    });
  }
}
await writeJson('src/data/current-official.json', snapshot('Gouvernement, Assemblée nationale, Sénat et sites des formations politiques', 'Conditions de chaque source', roster.checkedAt, [...organizations.values()], relations, roster.scope));
console.log(`${roster.people.length} identités vérifiées ; ${relations.length} fonctions sourcées ; ${roster.unresolved.length} poste non résolu.`);
