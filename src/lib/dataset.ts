import original from '../data/graph.json';
import supplement from '../data/attali-wikidata.json';
import participations from '../data/attali-participations.json';
import network from '../data/network-wikidata.json';
import assembly from '../data/assembly.json';
import integrityWatch from '../data/integrity-watch.json';
import institutions from '../data/institution-participations.json';
import corrections from '../data/entity-corrections.json';
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
  return { meta: { ...base.meta, source: 'Wikidata, Assemblée nationale, HATVP via Integrity Watch et documents officiels', license: 'Wikidata : CC0-1.0 ; données publiques : licence ouverte ; documents : conditions de la source', description: 'Corpus exploratoire de la vie publique, enrichi depuis douze institutions et par des sources parlementaires et déclaratives. Sélection non exhaustive et non représentative.', supplementedAt: extra.meta.fetchedAt, properties: [...new Set([...base.meta.properties, ...extra.meta.properties, ...official.map(relation => relation.property)])], peopleCount: mergedEntities.filter(entity => entity.inCorpus && entity.type === 'person').length, entityCount: entities.size, relationCount: relations.size }, entities: mergedEntities, relations: [...relations.values()] };
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
  const dated: Relation[] = institutions.compositions.flatMap(composition => composition.participants.map(person => ({
    id: `${composition.id}-${person.person}`, source: person.person, target: composition.institution,
    category: composition.category as Relation['category'], property: 'official:participation', label: composition.relationLabel,
    role: person.role, pointInTime: composition.date, cohort: { id: composition.id, label: composition.label },
    statementUrl: `${composition.source}${'pdfPage' in person ? `#page=${person.pdfPage}` : ''}`,
    references: [{ id: composition.id, urls: [composition.source], statedIn: [], importedFrom: [] }],
    evidence: { kind: 'official', title: composition.title, locator: person.locator, note: composition.note, checkedAt: institutions.checkedAt },
  })));
  let data = mergeDatasets(original as GraphData, supplement as GraphData, official);
  data = mergeDatasets(data, network as GraphData, dated);
  data = mergeDatasets(data, assembly as GraphData, []);
  data = mergeDatasets(data, integrityWatch as GraphData, []);
  for (const correction of corrections) {
    const entity = data.entities.find(entity => entity.id === correction.id);
    if (entity) { entity.label = correction.label; entity.labelSource = correction.labelSource; }
  }
  return data;
}
