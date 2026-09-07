import type { Entity, GraphData, Relation } from './types';
import { comparePeriods, supportsPeriods, type Overlap } from './temporal';

export interface InstitutionParticipation { entity: Entity; people: Map<string, Relation[]> }
export interface InstitutionBridge { id: string; source: string; target: string; people: string[] }

/** Receives already filtered evidence. No inferred memberships or merged tenures. */
export function institutionParticipation(graph: Pick<GraphData, 'entities' | 'relations'>): InstitutionParticipation[] {
  const entities = new Map(graph.entities.map(e => [e.id, e]));
  const records = new Map<string, InstitutionParticipation>();
  for (const relation of graph.relations) {
    const source = entities.get(relation.source), target = entities.get(relation.target);
    if (!source || !target) continue;
    const person = source.type === 'person' ? source : target.type === 'person' ? target : undefined;
    const institution = person === source ? target : source;
    if (!person || !supportsPeriods(institution)) continue;
    let record = records.get(institution.id);
    if (!record) { record = { entity: institution, people: new Map() }; records.set(institution.id, record); }
    const statements = record.people.get(person.id) ?? [];
    statements.push(relation); record.people.set(person.id, statements);
  }
  return [...records.values()].sort((a, b) => b.people.size - a.people.size || a.entity.label.localeCompare(b.entity.label, 'fr'));
}

export function sharedInstitutions(records: InstitutionParticipation[], selected: string[], threshold: 'all' | 'two'): InstitutionParticipation[] {
  const people = [...new Set(selected)];
  if (people.length < 2) return [];
  const required = threshold === 'all' ? people.length : 2;
  return records.map(record => ({ entity: record.entity, people: new Map(people.filter(id => record.people.has(id)).map(id => [id, record.people.get(id)!])) }))
    .filter(record => record.people.size >= required)
    .sort((a, b) => b.people.size - a.people.size || a.entity.label.localeCompare(b.entity.label, 'fr'));
}

export function institutionBridges(records: InstitutionParticipation[]): InstitutionBridge[] {
  const byPerson = new Map<string, string[]>();
  for (const record of records) for (const person of record.people.keys()) {
    const institutions = byPerson.get(person) ?? [];
    institutions.push(record.entity.id); byPerson.set(person, institutions);
  }
  const bridges = new Map<string, InstitutionBridge>();
  for (const [person, institutions] of byPerson) {
    institutions.sort();
    for (let i = 0; i < institutions.length; i++) for (let j = i + 1; j < institutions.length; j++) {
      const source = institutions[i], target = institutions[j], id = JSON.stringify([source, target]);
      let bridge = bridges.get(id);
      if (!bridge) { bridge = { id, source, target, people: [] }; bridges.set(id, bridge); }
      bridge.people.push(person);
    }
  }
  return [...bridges.values()].sort((a, b) => b.people.length - a.people.length || a.id.localeCompare(b.id));
}

export function passageOverlap(left: Relation[], right: Relation[]): Record<Overlap, number> {
  const counts = { documented: 0, possible: 0, outside: 0, unknown: 0 };
  for (const a of left) for (const b of right) counts[comparePeriods(a, b)]++;
  return counts;
}
