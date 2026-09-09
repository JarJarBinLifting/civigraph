import type { Category, Entity, GraphData, Relation } from './types';
import { periodBounds } from './temporal';
import { periodLabel, shortLabel } from './presentation';
import { getGraphIndex } from './graph-index';
import { compareRelationsChronologically, relationSortDate } from './chronology';

export interface ProfileFact { entity: Entity; relation: Relation }
export interface CareerEntry { entity: Entity; relations: Relation[]; category: Category; sortDate: number | null; key: string }
export function getCareerTimeline(data: GraphData, person: Entity): { dated: CareerEntry[]; undated: CareerEntry[] } {
  const index = getGraphIndex(data);
  const entries = new Map<string, CareerEntry>();
  for (const relation of index.outgoing.get(person.id) ?? []) {
    const entity = index.entities.get(relation.target);
    if (!entity) continue;
    const key = JSON.stringify([entity.id, relation.category, relation.label, relation.role, relation.start, relation.end, relation.pointInTime, relation.cohort]);
    const existing = entries.get(key);
    if (existing) { existing.relations.push(relation); continue; }
    entries.set(key, { key, entity, category: relation.category, relations: [relation], sortDate: relationSortDate(relation) });
  }
  const all = [...entries.values()];
  return {
    dated: all.filter(entry => entry.sortDate !== null).sort((a, b) => a.sortDate! - b.sortDate! || a.entity.label.localeCompare(b.entity.label, 'fr') || a.key.localeCompare(b.key)),
    undated: all.filter(entry => entry.sortDate === null).sort((a, b) => a.category.localeCompare(b.category) || a.entity.label.localeCompare(b.entity.label, 'fr')),
  };
}
const categories: Category[] = ['office', 'employment', 'education', 'party', 'membership'];

export function getPersonProfile(data: GraphData, person: Entity) {
  const { entities, outgoing } = getGraphIndex(data);
  const statements = outgoing.get(person.id) ?? [];
  // These are selected individual statements, never merged into a continuous tenure.
  const order = (a: Relation, b: Relation) => Number(Boolean(periodBounds(b))) - Number(Boolean(periodBounds(a))) || (b.start?.value ?? b.pointInTime?.value ?? '').localeCompare(a.start?.value ?? a.pointInTime?.value ?? '') || Number(Boolean(b.evidence)) - Number(Boolean(a.evidence)) || a.id.localeCompare(b.id);
  const sections = categories.flatMap(category => {
    const candidates = statements.filter(relation => relation.category === category).sort(order);
    const targets = new Set<string>();
    const facts = candidates.flatMap(relation => {
      const entity = entities.get(relation.target);
      if (!entity || targets.has(entity.id)) return [];
      targets.add(entity.id);
      return [{ entity, relation }];
    });
    return facts.length ? [{ category, facts: facts.slice(0, category === 'membership' ? 2 : 3).sort((a, b) => compareRelationsChronologically(a.relation, b.relation)), total: facts.length }] : [];
  });
  const offices = statements.filter(relation => relation.category === 'office' && !relation.id.startsWith('AN:')).sort(order);
  const headline = offices[0] ?? sections.find(section => section.category === 'office')?.facts[0]?.relation;
  const school = sections.find(section => section.category === 'education')?.facts[0];
  const paragraphs: string[] = [];
  if (headline) paragraphs.push(`Fonction : ${headline.role ? `${headline.role} · ` : ''}${shortLabel(entities.get(headline.target)!)} (${periodLabel(headline)}).`);
  if (school) paragraphs.push(`Études : ${shortLabel(school.entity)}${school.relation.start || school.relation.end || school.relation.pointInTime ? ` (${periodLabel(school.relation)})` : ', dates non précisées'}.`);
  if (!paragraphs.length) paragraphs.push('Les activités et organisations recensées sont présentées ci-dessous.');
  return { paragraphs, sections };
}
