import type { GraphData, ViewState } from './types';
import { periodBounds } from './temporal';
import { periodLabel } from './presentation';
import { getGraphIndex } from './graph-index';

type Graph = Pick<GraphData, 'entities' | 'relations'>;
export const TIME_BANDS = ['0 à 5 ans', '5 à 20 ans', '20 à 50 ans', 'Plus de 50 ans'];
export interface TimeReference { first: number; last: number; label: string; year: number; kind: 'year' | 'passage' }
export interface Chronology { reference: TimeReference; nodes: Map<string, { band: number | null; gap: number | null }>; counts: number[]; unknown: number }
export interface GraphLayout {
  positions: Map<string, { x: number; y: number }>;
  rings: { radius: number; band: number }[];
  unknownIds: string[];
  historyIds: string[];
  unknownBox?: { x: number; y: number; width: number; height: number };
}

export function getTimeReference(data: GraphData, view: Pick<ViewState, 'year' | 'period'>): TimeReference {
  const relation = getGraphIndex(data).relations.get(view.period ?? '');
  const bounds = relation && periodBounds(relation);
  if (view.year === null && bounds) return { ...bounds, label: relation.cohort?.label ?? periodLabel(relation), year: new Date(bounds.first).getUTCFullYear(), kind: 'passage' };
  const year = view.year ?? Number(data.meta.fetchedAt.slice(0, 4));
  const date = new Date(0);
  date.setUTCFullYear(year, 0, 1);
  const first = date.getTime();
  date.setUTCFullYear(year + 1, 0, 1);
  return { first, last: date.getTime() - 1, label: String(year), year, kind: 'year' };
}

export function getChronology(graph: Graph, focus: string, reference: TimeReference): Chronology {
  const nodes: Chronology['nodes'] = new Map();
  const gaps = new Map<string, number>();
  for (const relation of graph.relations) {
    if (relation.source !== focus && relation.target !== focus) continue;
    const bounds = periodBounds(relation);
    if (!bounds) continue;
    const neighbor = relation.source === focus ? relation.target : relation.source;
    const gap = Math.max(0, reference.first - bounds.last, bounds.first - reference.last) / (365.2425 * 86_400_000);
    gaps.set(neighbor, Math.min(gaps.get(neighbor) ?? Infinity, gap));
  }
  for (const entity of graph.entities) {
    if (entity.id === focus) continue;
    const gap = gaps.get(entity.id) ?? null;
    nodes.set(entity.id, { gap, band: gap === null ? null : gap <= 5 ? 0 : gap <= 20 ? 1 : gap <= 50 ? 2 : 3 });
  }
  const values = [...nodes.values()];
  return { reference, nodes, counts: TIME_BANDS.map((_, i) => values.filter(item => item.band === i).length), unknown: values.filter(item => item.band === null).length };
}

export function layoutGraph(graph: Graph, focus: string, trail: string[], chronology: Chronology): GraphLayout {
  const positions: GraphLayout['positions'] = new Map([[focus, { x: 0, y: 0 }]]);
  const historyIds = trail.filter(id => id !== focus && graph.entities.some(entity => entity.id === id));
  const neighbors = graph.entities.filter(entity => entity.id !== focus && !historyIds.includes(entity.id)).sort((a, b) => a.label.localeCompare(b.label, 'fr') || a.id.localeCompare(b.id));
  const unknownIds = neighbors.filter(entity => chronology.nodes.get(entity.id)?.band === null).map(entity => entity.id);
  const rings: GraphLayout['rings'] = [];
  let outer = 40;
  for (let band = 0; band < TIME_BANDS.length; band++) {
    const members = neighbors.filter(entity => chronology.nodes.get(entity.id)?.band === band);
    if (!members.length) continue;
    let offset = 0;
    let radius = outer + 140;
    while (offset < members.length) {
      const count = Math.min(members.length - offset, Math.max(6, Math.floor(2 * Math.PI * radius / 130)));
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + i / count * Math.PI * 2 + (offset ? .16 : 0);
        positions.set(members[offset + i].id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
      offset += count;
      outer = radius;
      radius += 120;
    }
    rings.push({ radius: outer + 60, band });
  }
  let unknownBox: GraphLayout['unknownBox'];
  if (unknownIds.length) {
    const columns = Math.ceil(Math.sqrt(unknownIds.length));
    const rows = Math.ceil(unknownIds.length / columns);
    const x = outer + 180;
    const y = -(rows - 1) * 55;
    unknownIds.forEach((id, index) => positions.set(id, { x: x + (index % columns) * 130, y: y + Math.floor(index / columns) * 110 }));
    unknownBox = { x: x - 65, y: y - 75, width: columns * 130, height: rows * 110 + 25 };
  }
  // Navigation history is kept apart from the temporal scale.
  [...historyIds].reverse().forEach((id, i) => positions.set(id, { x: -(outer + 170 + i * 170), y: 0 }));
  return { positions, rings, unknownIds, historyIds, unknownBox };
}
