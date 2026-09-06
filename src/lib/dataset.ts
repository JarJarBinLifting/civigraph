import original from '../data/graph.json';
import supplement from '../data/attali-wikidata.json';
import participations from '../data/attali-participations.json';
import type { GraphData, Relation } from './types';

export function mergeDatasets(base: GraphData, extra: GraphData, official: Relation[]): GraphData {
  const entities = new Map(extra.entities.map(entity => [entity.id, entity]));
  for (const entity of base.entities) {
    const added = entities.get(entity.id);
    entities.set(entity.id, { ...entity, inCorpus: entity.inCorpus || Boolean(added?.inCorpus) });
  }
  const relations = new Map(extra.relations.map(relation => [relation.id, relation]));
  for (const relation of base.relations) relations.set(relation.id, relation);
  for (const relation of official) relations.set(relation.id, relation);
  const mergedEntities = [...entities.values()];
  return { meta: { ...base.meta, source: 'Wikidata et sources officielles', license: 'Wikidata : CC0-1.0 ; documents officiels : conditions de la source', description: 'Corpus exploratoire de la vie politique française, complété par une sélection de participants à la commission Attali. Non exhaustif et non représentatif.', supplementedAt: extra.meta.fetchedAt, peopleCount: mergedEntities.filter(entity => entity.inCorpus && entity.type === 'person').length, entityCount: entities.size, relationCount: relations.size }, entities: mergedEntities, relations: [...relations.values()] };
}

export function loadDataset(): GraphData {
  const official: Relation[] = participations.compositions.flatMap(composition => composition.participants.map(person => ({
    id: `${composition.id}-${person.person}`,
    source: person.person,
    target: participations.institution,
    category: 'membership',
    property: 'official:participation',
    label: 'A participé à',
    role: person.role,
    pointInTime: composition.date,
    cohort: { id: composition.id, label: composition.label },
    statementUrl: `${composition.source}${'page' in person ? `#page=${Number(person.page) + 1}` : ''}`,
    references: [{ id: composition.id, urls: [composition.source], statedIn: [], importedFrom: [] }],
    evidence: { kind: 'official', title: composition.title, locator: 'page' in person ? `Page imprimée ${person.page}` : composition.locator, note: composition.note, checkedAt: participations.checkedAt },
  })));
  return mergeDatasets(original as GraphData, supplement as GraphData, official);
}
