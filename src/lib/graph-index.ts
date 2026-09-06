import type { Entity, GraphData, Relation } from './types';
import { shortLabel } from './presentation';

export const normalizeName = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim();
type Graph = Pick<GraphData, 'entities' | 'relations'>;
const indexes = new WeakMap<Graph, ReturnType<typeof buildIndex>>();

function buildIndex(data: Graph) {
  const entities = new Map(data.entities.map(entity => [entity.id, entity]));
  const relations = new Map(data.relations.map(relation => [relation.id, relation]));
  const outgoing = new Map<string, Relation[]>();
  const incoming = new Map<string, Relation[]>();
  const incident = new Map<string, Relation[]>();
  const append = (map: Map<string, Relation[]>, id: string, relation: Relation) => {
    const group = map.get(id);
    if (group) group.push(relation); else map.set(id, [relation]);
  };
  for (const relation of data.relations) {
    append(outgoing, relation.source, relation);
    append(incoming, relation.target, relation);
    append(incident, relation.source, relation);
    if (relation.target !== relation.source) append(incident, relation.target, relation);
  }
  return {
    entities, relations, outgoing, incoming, incident,
    entityOrder: new Map(data.entities.map((entity, order) => [entity.id, order])),
    relationOrder: new Map(data.relations.map((relation, order) => [relation.id, order])),
    search: data.entities.map(entity => ({ entity, names: [normalizeName(entity.label), normalizeName(shortLabel(entity))] })),
  };
}

/** One index per immutable snapshot. Parallel declarations keep their identity and source order. */
export function getGraphIndex(data: Graph) {
  let index = indexes.get(data);
  if (!index) { index = buildIndex(data); indexes.set(data, index); }
  return index;
}

export function orderedEntities(data: Graph, ids: Iterable<string>): Entity[] {
  const index = getGraphIndex(data);
  return [...new Set(ids)].flatMap(id => index.entities.has(id) ? [index.entities.get(id)!] : [])
    .sort((a, b) => index.entityOrder.get(a.id)! - index.entityOrder.get(b.id)!);
}
