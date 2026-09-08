import catalogue from '../data/guided-cohorts.json';
import { getGraphIndex } from './graph-index';
import { comparePeriods, dateBounds, supportsPeriods } from './temporal';
import { sortRelationsChronologically } from './chronology';
import type { CommonConnection, Entity, GraphData, Relation } from './types';

export interface CohortGroup {
  id: string; kind: string; label: string; institution: Entity;
  members: { person: Entity; relations: Relation[] }[];
}
export function cohortGroups(data: GraphData): CohortGroup[] {
  const index = getGraphIndex(data);
  return catalogue.flatMap(entry => {
    const statements = data.relations.filter(r => r.cohort?.id === entry.id && r.evidence?.kind === 'official');
    const institution = index.entities.get(statements[0]?.target);
    if (!institution) return [];
    const people = new Map<string, Relation[]>();
    for (const r of statements) if (r.target === institution.id && index.entities.get(r.source)?.type === 'person') people.set(r.source, [...(people.get(r.source) ?? []), r]);
    const members = [...people].map(([id, relations]) => ({ person: index.entities.get(id)!, relations: sortRelationsChronologically(relations) })).sort((a, b) => a.person.label.localeCompare(b.person.label, 'fr'));
    return members.length ? [{ ...entry, label: statements[0].cohort!.label, institution, members }] : [];
  });
}
export function laterPassages(data: GraphData, person: string, group: CohortGroup): Relation[] {
  const dates = group.members.flatMap(m => m.relations).map(r => dateBounds(r.pointInTime ?? r.start)).filter(d => d !== null);
  if (!dates.length) return [];
  const after = Math.max(...dates.map(d => d.last));
  return sortRelationsChronologically((getGraphIndex(data).outgoing.get(person) ?? []).filter(r => {
    const date = dateBounds(r.start ?? r.pointInTime);
    return r.cohort?.id !== group.id && Boolean(date && date.first > after);
  }));
}
export function crossingPairs(common: CommonConnection[]) {
  return common.filter(c => supportsPeriods(c.entity)).flatMap(c => c.left.flatMap(left => c.right.map(right => ({
    id: `${left.id}:${right.id}`, entity: c.entity, left, right,
    status: comparePeriods(left, right),
    sameCohort: Boolean(left.evidence?.kind === 'official' && right.evidence?.kind === 'official' && left.cohort && left.cohort.id === right.cohort?.id),
  }))));
}
