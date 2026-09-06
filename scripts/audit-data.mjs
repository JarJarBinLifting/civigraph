import { readJson, writeJson } from './lib/import-utils.mjs';
import { periodBounds } from '../src/lib/temporal.ts';
import fs from 'node:fs/promises';

const original = await readJson('src/data/graph.json');
const attali = await readJson('src/data/attali-wikidata.json');
const attaliRosters = await readJson('src/data/attali-participations.json');
const institutionRosters = await readJson('src/data/institution-participations.json');
const network = await readJson('src/data/network-wikidata.json');
const assembly = await readJson('src/data/assembly.json');
const integrity = await readJson('src/data/integrity-watch.json');
const rosterRelations = (source, institution) => source.compositions.flatMap(composition => composition.participants.map(person => ({ id: `${composition.id}-${person.person}`, source: person.person, target: institution ?? composition.institution, category: composition.category ?? 'membership', pointInTime: composition.date })));
const before = [...new Map([...attali.relations, ...original.relations, ...rosterRelations(attaliRosters, attaliRosters.institution)].map(relation => [relation.id, relation])).values()];
const after = [...new Map([...network.relations, ...assembly.relations, ...integrity.relations, ...rosterRelations(institutionRosters), ...before].map(relation => [relation.id, relation])).values()];
const entities = new Map();
for (const data of [original, attali, network, assembly]) for (const entity of data.entities) entities.set(entity.id, { ...entity, inCorpus: entity.inCorpus || Boolean(entities.get(entity.id)?.inCorpus) });
const summary = relations => ({ statements: relations.length, datedStatements: relations.filter(periodBounds).length });
const neighbors = (relations, target) => {
  const items = relations.filter(relation => relation.target === target);
  return { people: new Set(items.map(relation => relation.source)).size, peopleWithUsableDates: new Set(items.filter(periodBounds).map(relation => relation.source)).size, ...summary(items) };
};
const institutions = (await readJson('scripts/institutions.json')).map(seed => ({ id: seed.id, label: seed.label, before: neighbors(before, seed.id), after: neighbors(after, seed.id) }));
const assemblyImport = await readJson('src/data/assembly-import.json');
const integrityImport = await readJson('src/data/integrity-watch-import.json');
const report = { checkedAt: new Date().toISOString(), people: [...entities.values()].filter(entity => entity.inCorpus && entity.type === 'person').length, entities: entities.size, before: summary(before), after: summary(after), sources: { wikidata: original.relations.length + attali.relations.length + network.relations.length, assembly: assembly.relations.length, hatvpViaIntegrityWatch: integrity.relations.length, officialCompositions: rosterRelations(attaliRosters).length + rosterRelations(institutionRosters).length }, institutions, assemblyPeopleMatched: assemblyImport.matched.length, assemblyRejected: assemblyImport.rejected, integrityPeopleChecked: integrityImport.matched.length, integrityPeopleWithImportedActivities: integrityImport.matched.filter(person => person.relations > 0).length, integrityUnmatchedLabels: integrityImport.unmatchedOrganizations.length };
await writeJson('docs/data-coverage.json', report);
const rows = institutions.map(institution => `| ${institution.label} | ${institution.before.people} → ${institution.after.people} | ${institution.before.peopleWithUsableDates} → ${institution.after.peopleWithUsableDates} |`);
await fs.writeFile('docs/data-coverage.md', `# Couverture du corpus — 6 septembre 2026\n\n${report.people} personnes, ${report.entities} entités, ${after.length} déclarations. Les ${before.length} déclarations antérieures sont conservées. Les compteurs portent sur les déclarations de sources, pas sur des faits indépendants : un même passage peut être documenté plusieurs fois.\n\nLes périodes utilisables passent de **${report.before.datedStatements}/${before.length}** à **${report.after.datedStatements}/${after.length}**. Une période utilisable possède deux bornes valides ou un repère ponctuel ; cela ne garantit pas un chevauchement avec n’importe quelle période de référence.\n\n| Institution | Personnes liées avant → après | Avec au moins une période utilisable avant → après |\n| --- | ---: | ---: |\n${rows.join('\n')}\n\nSources : ${report.sources.wikidata} déclarations Wikidata ; ${report.sources.assembly} mandats de l’Assemblée ; ${report.sources.hatvpViaIntegrityWatch} activités HATVP via Integrity Watch ; ${report.sources.officialCompositions} participations de compositions officielles.\n\nL’Assemblée est rapprochée pour ${report.assemblyPeopleMatched} personnes. Deux mandats aux dates inversées dans la source sont écartés et consignés dans le manifeste. Integrity Watch : ${report.integrityPeopleChecked} déclarants rapprochés par identifiant avec contrôle de l’UUID du document HATVP ; ${report.integrityPeopleWithImportedActivities} ont des activités dans les organismes identifiés. ${report.integrityUnmatchedLabels} intitulés d’organismes restent à rapprocher et ne créent pas de nouveaux liens.\n\nLa recherche inverse est plafonnée à 60 profils par institution. Elle ne représente ni tous les membres ni une sélection statistique ; son manifeste conserve requêtes et résultats. Aucune absence de résultat ne permet de conclure à l’absence de relation.\n\nReproduction : Node.js 24, \`node scripts/audit-data.mjs\`. Les indicateurs détaillés sont dans [data-coverage.json](data-coverage.json).\n`);
console.log(report);
