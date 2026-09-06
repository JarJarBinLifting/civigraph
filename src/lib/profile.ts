import type { Category, Entity, GraphData, Relation } from './types';
import { periodBounds } from './temporal';
import { periodLabel, shortLabel } from './presentation';
import { getGraphIndex } from './graph-index';

export interface ProfileFact { entity: Entity; relation: Relation }
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
    return facts.length ? [{ category, facts: facts.slice(0, category === 'membership' ? 2 : 3), total: facts.length }] : [];
  });
  const offices = statements.filter(relation => relation.category === 'office' && !relation.id.startsWith('AN:')).sort(order);
  const headline = offices[0] ?? sections.find(section => section.category === 'office')?.facts[0]?.relation;
  const school = sections.find(section => section.category === 'education')?.facts[0];
  const paragraphs: string[] = [];
  if (headline) paragraphs.push(`Son parcours documenté comprend la fonction « ${shortLabel(entities.get(headline.target)!)} » (${periodLabel(headline)}).`);
  if (school) paragraphs.push(`Son parcours comprend aussi des études à l’établissement « ${shortLabel(school.entity)} »${school.relation.start || school.relation.end || school.relation.pointInTime ? ` (${periodLabel(school.relation)})` : ', sans période précisée'}.`);
  if (!paragraphs.length) paragraphs.push('Les repères ci-dessous présentent les activités et organisations documentées dans ce corpus.');
  return { paragraphs, sections };
}
