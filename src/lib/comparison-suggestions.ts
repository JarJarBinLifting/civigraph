import type { Category, CommonConnection, Entity, GraphData, Relation } from './types';
import { getGraphIndex } from './graph-index';
import { comparePeriods, supportsPeriods } from './temporal';
import { sortRelationsChronologically } from './chronology';

export interface ComparisonSuggestion {
  person: Entity;
  connections: (CommonConnection & { sharedPeriod: boolean })[];
  sharedPeriodCount: number;
}

export function getComparisonSuggestions(data: GraphData, personId: string, categories: Category[]): ComparisonSuggestion[] {
  const index = getGraphIndex(data);
  if (index.entities.get(personId)?.type !== 'person' || !categories.length) return [];
  const institutions = new Map<string, Relation[]>();
  for (const relation of index.outgoing.get(personId) ?? []) {
    const target = index.entities.get(relation.target);
    // Q327591 is independent political status, not a shared institution.
    if (!categories.includes(relation.category) || !target || target.id === 'Q327591' || !supportsPeriods(target)) continue;
    const group = institutions.get(target.id);
    if (group) group.push(relation); else institutions.set(target.id, [relation]);
  }
  const candidates = new Map<string, ComparisonSuggestion>();
  for (const [institutionId, statements] of institutions) {
    const participants = new Map<string, Relation[]>();
    for (const relation of index.incoming.get(institutionId) ?? []) {
      if (relation.source === personId || !categories.includes(relation.category) || index.entities.get(relation.source)?.type !== 'person') continue;
      const group = participants.get(relation.source);
      if (group) group.push(relation); else participants.set(relation.source, [relation]);
    }
    const left = sortRelationsChronologically(statements);
    for (const [id, passages] of participants) {
      const sharedPeriod = left.some(a => passages.some(b => comparePeriods(a, b) === 'documented'));
      const candidate = candidates.get(id) ?? { person: index.entities.get(id)!, connections: [], sharedPeriodCount: 0 };
      candidate.connections.push({ entity: index.entities.get(institutionId)!, left, right: sortRelationsChronologically(passages), sharedPeriod });
      if (sharedPeriod) candidate.sharedPeriodCount++;
      candidates.set(id, candidate);
    }
  }
  for (const candidate of candidates.values()) candidate.connections.sort((a, b) => Number(b.sharedPeriod) - Number(a.sharedPeriod) || a.entity.label.localeCompare(b.entity.label, 'fr') || a.entity.id.localeCompare(b.entity.id));
  return [...candidates.values()].sort((a, b) => b.connections.length - a.connections.length || b.sharedPeriodCount - a.sharedPeriodCount || a.person.label.localeCompare(b.person.label, 'fr') || a.person.id.localeCompare(b.person.id));
}
