import catalog from '../data/institution-milieus.json';
import type { Entity, GraphData, Relation } from './types';
import { institutionParticipation } from './system-analysis';
import { periodBounds } from './temporal';
import { sortRelationsChronologically } from './chronology';

export const MILIEUS = [
  { id: 'politics', label: 'Partis politiques' }, { id: 'administration', label: 'Haute administration' },
  { id: 'cabinets', label: 'Cabinets' }, { id: 'business', label: 'Entreprises' },
  { id: 'media', label: 'Médias' }, { id: 'education', label: 'Formation' },
  { id: 'circles', label: 'Cercles et commissions' },
] as const;
export type MilieuId = typeof MILIEUS[number]['id'];
export interface MilieuPassage { entity: Entity; statements: Relation[] }
export interface PersonMilieu { id: MilieuId; label: string; passages: MilieuPassage[] }
export interface MilieuProfile { person: Entity; milieus: PersonMilieu[]; unclassified: number }
export interface CirclePerson { person: Entity; passages: Relation[]; affiliations: Relation[] }
export interface CirclePair { left: string; right: string; contemporary: boolean; proofs: Relation[] }
export interface CrossPartyCircle { entity: Entity; people: CirclePerson[]; partyIds: string[]; pairs: CirclePair[] }
const classification = new Map(catalog.entries.map(entry => [entry.id, entry.milieu as MilieuId]));
const unique = (rs: Relation[]) => sortRelationsChronologically([...new Map(rs.map(r => [r.id, r])).values()]);

/** P102 identifies party membership; parliamentary groups and independent status are not parties. */
function partyMembership(r: Relation, entities: Map<string, Entity>) {
  return r.category === 'party' && r.property === 'P102' && r.target !== 'Q327591' && entities.get(r.target)?.type === 'party';
}

/** Conservative common intersection of all four facts, not separate pairwise overlaps. */
function contemporaneous(proofs: Relation[], periods: Map<string, ReturnType<typeof periodBounds>>) {
  const bounds = proofs.map(r => periods.get(r.id));
  if (bounds.some(b => !b)) return false;
  if (Math.max(...bounds.map(b => b!.certainFirst)) <= Math.min(...bounds.map(b => b!.certainLast))) return true;
  const [left, right] = proofs;
  const [a, b, partyA, partyB] = bounds as NonNullable<ReturnType<typeof periodBounds>>[];
  if (!left.evidence || !right.evidence || !left.cohort || left.cohort.id !== right.cohort?.id || left.target !== right.target) return false;
  const first = Math.max(a.first, b.first), last = Math.min(a.last, b.last);
  return first <= last && [partyA, partyB].every(p => p.certainFirst <= first && p.certainLast >= last);
}

export function crossPartyCircles(data: GraphData, passages: Relation[], contemporaryOnly = false): CrossPartyCircle[] {
  const entities = new Map(data.entities.map(e => [e.id, e]));
  const periods = new Map([...data.relations, ...passages].map(r => [r.id, periodBounds(r)]));
  const affiliations = new Map<string, Relation[]>();
  for (const r of data.relations) if (partyMembership(r, entities)) {
    const statements = affiliations.get(r.source) ?? [];
    statements.push(r); affiliations.set(r.source, statements);
  }
  const result: CrossPartyCircle[] = [];
  for (const record of institutionParticipation({ entities: data.entities, relations: passages.filter(r => r.category !== 'party') })) {
    if (record.entity.type === 'party') continue;
    const people = [...record.people].filter(([id]) => affiliations.has(id)).map(([id, rs]) => ({ person: entities.get(id)!, passages: unique(rs), affiliations: unique(affiliations.get(id)!) })).sort((a, b) => a.person.label.localeCompare(b.person.label, 'fr'));
    const pairs: CirclePair[] = [];
    for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
      const left = people[i], right = people[j];
      let witness: Relation[] | undefined, isContemporary = false;
      search: for (const a of left.affiliations) for (const b of right.affiliations) {
        if (a.target === b.target) continue;
        witness ??= [left.passages[0], right.passages[0], a, b];
        for (const lp of left.passages) for (const rp of right.passages) {
          const proofs = [lp, rp, a, b];
          if (contemporaneous(proofs, periods)) { witness = proofs; isContemporary = true; break search; }
        }
      }
      if (witness && (!contemporaryOnly || isContemporary)) pairs.push({ left: left.person.id, right: right.person.id, contemporary: isContemporary, proofs: witness });
    }
    if (!pairs.length) continue;
    const included = new Set(pairs.flatMap(p => [p.left, p.right]));
    const includedPeople = people.filter(p => included.has(p.person.id));
    const partyIds = [...new Set((contemporaryOnly ? pairs.flatMap(p => p.proofs.filter(r => r.category === 'party')) : includedPeople.flatMap(p => p.affiliations)).map(r => r.target))].sort();
    result.push({ entity: record.entity, people: includedPeople, partyIds, pairs });
  }
  return result.sort((a, b) => b.people.length - a.people.length || a.entity.label.localeCompare(b.entity.label, 'fr'));
}

/** Explicit editorial classification; unknown organizations are never guessed from their label. */
export function personMilieus(data: GraphData, relations: Relation[]): MilieuProfile[] {
  const entities = new Map(data.entities.map(e => [e.id, e]));
  const profiles = new Map<string, { person: Entity; groups: Map<MilieuId, Map<string, MilieuPassage>>; unknown: Set<string> }>();
  for (const r of relations) {
    const person = entities.get(r.source), target = entities.get(r.target);
    if (person?.type !== 'person' || !target || target.type === 'person') continue;
    let profile = profiles.get(person.id);
    if (!profile) { profile = { person, groups: new Map(), unknown: new Set() }; profiles.set(person.id, profile); }
    const direct = partyMembership(r, entities) ? 'politics' : r.category === 'education' && target.type === 'school' ? 'education' : classification.get(target.id);
    const ids = direct ? [direct] : [...new Set((target.contexts ?? []).filter(c => c.property === 'P2389').map(c => classification.get(c.id)).filter((id): id is MilieuId => Boolean(id)))];
    if (!ids.length) { profile.unknown.add(target.id); continue; }
    for (const id of ids) {
      const group = profile.groups.get(id) ?? new Map<string, MilieuPassage>();
      const passage = group.get(target.id) ?? { entity: target, statements: [] };
      passage.statements.push(r); group.set(target.id, passage); profile.groups.set(id, group);
    }
  }
  return [...profiles.values()].map(p => ({ person: p.person, unclassified: p.unknown.size, milieus: MILIEUS.filter(m => p.groups.has(m.id)).map(m => ({ ...m, passages: [...p.groups.get(m.id)!.values()].map(p => ({ ...p, statements: unique(p.statements) })).sort((a, b) => a.entity.label.localeCompare(b.entity.label, 'fr')) })) }))
    .sort((a, b) => b.milieus.length - a.milieus.length || a.person.label.localeCompare(b.person.label, 'fr'));
}
