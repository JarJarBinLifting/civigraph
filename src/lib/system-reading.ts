import type { Category, Entity, GraphData, Relation } from './types';
import type { SystemGraph, SystemPositions } from './system-graph';
import { comparePeriods } from './temporal';

export const SYSTEMS = [
  { id: 'all', label: 'Ensemble' }, { id: 'party', label: 'Politique' },
  { id: 'education', label: 'Formation' }, { id: 'employment', label: 'Professionnel' },
  { id: 'membership', label: 'Organisations' }, { id: 'office', label: 'Fonctions publiques' },
] as const;
export type System = typeof SYSTEMS[number]['id'];
export const SYSTEM_SCOPE: Record<System, string> = {
  all: 'Afficher tous les types de liens recensés.',
  party: 'Les partis et groupes parlementaires mentionnés dans les sources, ainsi que le statut indépendant.',
  education: 'Les écoles et universités fréquentées.',
  employment: 'Les employeurs cités dans les sources. Les titres de poste apparaissent dans « Fonctions publiques ».',
  membership: 'Les associations, commissions et autres organisations auxquelles les personnes ont participé.',
  office: 'Les sources regroupent ici les mandats publics et certains postes professionnels. Nous ne pouvons pas toujours les distinguer.',
};
export interface PoliticalAffiliation { party: Entity; color: string; statements: Relation[] }
export interface PoliticalIndex { people: Map<string, PoliticalAffiliation[]>; parties: { entity: Entity; color: string; people: number }[] }
export const UNKNOWN_POLITICAL_COLOR = '#89929f';
export function categoriesForSystem(system: System, categories: Category[]): Category[] {
  return system === 'all' ? categories : categories.filter(category => category === system);
}

/** Categorical colors are identifiers, not official party colors or an ideological scale. */
function identityNumber(id: string) {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function politicalAffiliations(data: GraphData): PoliticalIndex {
  const entities = new Map(data.entities.map(e => [e.id, e]));
  const people = new Map(data.entities.filter(e => e.type === 'person').map(e => [e.id, [] as PoliticalAffiliation[]]));
  const counts = new Map<string, Set<string>>();
  const partyColor = (id: string) => `hsl(${identityNumber(id) % 360}, ${55 + identityNumber(id) % 15}%, ${35 + identityNumber(id) % 12}%)`;
  for (const statement of data.relations) {
    if (statement.category !== 'party') continue;
    const source = entities.get(statement.source), target = entities.get(statement.target);
    const person = source?.type === 'person' ? source : target?.type === 'person' ? target : undefined;
    const party = person === source ? target : source;
    if (!person || party?.type !== 'party') continue;
    const affiliations = people.get(person.id)!;
    let affiliation = affiliations.find(a => a.party.id === party.id);
    if (!affiliation) { affiliation = { party, color: partyColor(party.id), statements: [] }; affiliations.push(affiliation); }
    affiliation.statements.push(statement);
    const members = counts.get(party.id) ?? new Set<string>();
    members.add(person.id); counts.set(party.id, members);
  }
  for (const affiliations of people.values()) affiliations.sort((a, b) => a.party.label.localeCompare(b.party.label, 'fr'));
  const parties = [...counts].map(([id, members]) => ({ entity: entities.get(id)!, color: partyColor(id), people: members.size }))
    .sort((a, b) => b.people - a.people || a.entity.label.localeCompare(b.entity.label, 'fr'));
  return { people, parties };
}

/** Equal slices retain every documented affiliation; no single "current party" is inferred. */
export function affiliationSymbol(affiliations: PoliticalAffiliation[]): string | undefined {
  if (affiliations.length < 2) return undefined;
  const angle = Math.PI * 2 / affiliations.length;
  const paths = affiliations.map((a, i) => {
    const start = i * angle - Math.PI / 2, end = start + angle;
    return `<path fill="${a.color}" d="M32 32L${32 + 31 * Math.cos(start)} ${32 + 31 * Math.sin(start)}A31 31 0 ${angle > Math.PI ? 1 : 0} 1 ${32 + 31 * Math.cos(end)} ${32 + 31 * Math.sin(end)}Z"/>`;
  }).join('');
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${paths}</svg>`)}`;
}

/** All institutional anchors are retained. Multi-institution paths sit between their anchors. */
export function organizeSystem(graph: SystemGraph): SystemPositions {
  const positions: SystemPositions = {};
  const entities = new Map(graph.entities.map(e => [e.id, e]));
  const institutions = graph.entities.filter(e => e.type !== 'person').sort((a, b) => (graph.neighbors.get(b.id)?.size ?? 0) - (graph.neighbors.get(a.id)?.size ?? 0) || a.id.localeCompare(b.id));
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const hubs = institutions.filter(e => (graph.neighbors.get(e.id)?.size ?? 0) >= 4);
  if (!hubs.length) hubs.push(...institutions);
  const hubIds = new Set(hubs.map(e => e.id));
  hubs.forEach((e, i) => {
    const radius = 650 * Math.sqrt(i), angle = i * goldenAngle;
    positions[e.id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  // Small institutions follow their documented shared paths; none is dropped or
  // folded into a single exclusive hub. This avoids a distant ring of degree-one
  // institutions forcing all the shared paths into a tiny area on the overview.
  for (const institution of institutions.filter(e => !hubIds.has(e.id))) {
    const anchors = [...new Set([...(graph.neighbors.get(institution.id) ?? [])].flatMap(person => [...(graph.neighbors.get(person) ?? [])].filter(id => hubIds.has(id))))].sort();
    const hash = identityNumber(institution.id), angle = hash / 4294967296 * Math.PI * 2;
    const center = anchors.length ? anchors.reduce((p, id) => ({ x: p.x + positions[id].x / anchors.length, y: p.y + positions[id].y / anchors.length }), { x: 0, y: 0 }) : { x: Math.cos(angle) * 650 * Math.sqrt(hubs.length + 1), y: Math.sin(angle) * 650 * Math.sqrt(hubs.length + 1) };
    const radius = 100 + hash % 180;
    positions[institution.id] = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  }
  graph.entities.filter(e => e.type === 'person').sort((a, b) => a.id.localeCompare(b.id)).forEach((person, i) => {
    const anchors = [...(graph.neighbors.get(person.id) ?? [])].filter(id => entities.get(id)?.type !== 'person' && positions[id]).sort();
    const hash = identityNumber(person.id), angle = hash / 4294967296 * Math.PI * 2;
    if (!anchors.length) {
      const radius = 650 * Math.sqrt(hubs.length + 1) + 100 + hash % 200;
      positions[person.id] = { x: Math.cos(i * goldenAngle) * radius, y: Math.sin(i * goldenAngle) * radius };
      return;
    }
    const center = anchors.reduce((p, id) => ({ x: p.x + positions[id].x / anchors.length, y: p.y + positions[id].y / anchors.length }), { x: 0, y: 0 });
    const count = Math.max(...anchors.map(id => graph.neighbors.get(id)?.size ?? 1));
    const radius = (30 + Math.sqrt(count) * 13) * Math.sqrt(.1 + (hash % 997) / 1108);
    positions[person.id] = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });
  return positions;
}

export function sharedPassageFacts(left: Relation[], right: Relation[]): { sameInstitution: boolean; overlap: number; promotions: string[] } {
  let sameInstitution = false, overlap = 0;
  const promotions = new Set<string>();
  for (const a of left) for (const b of right) {
    if (a.target !== b.target || a.source === b.source) continue;
    sameInstitution = true;
    if (comparePeriods(a, b) === 'documented') overlap++;
    if (a.category === 'education' && b.category === 'education' && a.evidence?.kind === 'official' && b.evidence?.kind === 'official' && a.cohort && a.cohort.id === b.cohort?.id) promotions.add(a.cohort.label);
  }
  return { sameInstitution, overlap, promotions: [...promotions] };
}
