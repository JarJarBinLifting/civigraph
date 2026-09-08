import { writeFile } from 'node:fs/promises';
import roster from './people-2026.json';
import { loadDataset } from '../src/lib/dataset';
import original from '../src/data/graph.json';
import attali from '../src/data/attali-wikidata.json';
import network from '../src/data/network-wikidata.json';
import { periodBounds } from '../src/lib/temporal';

const data = loadDataset();
const nodeCount = (relations: typeof data.relations) => new Set(relations.flatMap(relation => [relation.source, relation.target])).size;
const education = data.relations.filter(relation => relation.category === 'education');
const graphCounts = { education: nodeCount(education), enaEducation: nodeCount(education.filter(relation => relation.target === 'Q273579')), assas: nodeCount(data.relations.filter(relation => relation.target === 'Q662976')) };
const previousPeople = new Set([original, attali, network].flatMap(source => source.entities.filter(entity => entity.inCorpus).map(entity => entity.id)));
const people = roster.people.map(person => {
  const entity = data.entities.find(entity => entity.id === person.id);
  const relations = data.relations.filter(relation => relation.source === person.id);
  const official = relations.filter(relation => relation.property === 'official:2026-role');
  const paths = relations.filter(relation => relation.property !== 'official:2026-role');
  if (!entity?.inCorpus || official.length !== person.roles.length) throw new Error(`Couverture incomplète : ${person.name}`);
  return { id: person.id, name: person.name, added: !previousPeople.has(person.id), roles: official.length, careerStatements: paths.length, datedCareerStatements: paths.filter(periodBounds).length };
});
const report = { checkedAt: roster.checkedAt, scope: roster.scope, coveredPeople: people.length, addedPeople: people.filter(person => person.added).length, officialRoles: people.reduce((sum, person) => sum + person.roles, 0), corpus: { people: data.meta.peopleCount, entities: data.entities.length, statements: data.relations.length }, graphCounts, withoutCareerData: people.filter(person => !person.careerStatements).map(person => person.name), unresolved: roster.unresolved, people };
await writeFile('docs/current-coverage.json', JSON.stringify(report, null, 2) + '\n');
await writeFile('docs/current-coverage.md', `# Socle national vérifié au ${roster.checkedAt}\n\n${roster.scope}\n\n${people.length} personnes couvertes, dont ${report.addedPeople} ajoutées au corpus ; ${report.officialRoles} fonctions attestées. Corpus fusionné : ${report.corpus.people} personnes, ${report.corpus.entities} entités, ${report.corpus.statements} déclarations.\n\nLa sélection, les identifiants et les preuves figurent dans [people-2026.json](../scripts/people-2026.json). Les limites et la procédure sont dans [current-sources.md](current-sources.md). Les déclarations répétées ne sont pas des faits indépendants.\n\n## Poste non résolu\n\n${roster.unresolved.map(item => `- ${item.organization} : ${item.reason} [Liste officielle](${item.url}) ; [recoupement](${item.corroboratingUrl}).`).join('\n')}\n\n## Couverture individuelle\n\n| Personne | Ajoutée | Fonctions attestées | Déclarations de parcours | Parcours aux périodes exploitables |\n| --- | --- | ---: | ---: | ---: |\n${people.map(person => `| ${person.name} | ${person.added ? 'Oui' : 'Déjà présente'} | ${person.roles} | ${person.careerStatements} | ${person.datedCareerStatements} |`).join('\n')}\n`);
console.log(JSON.stringify({ ...report, people: undefined }, null, 2));
