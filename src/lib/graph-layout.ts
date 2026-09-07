import type { Entity, EntityType, GraphData, ViewState } from './types';
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
  xScale: number;
  unknownZones: { x: number; y: number; width: number; height: number; type?: EntityType }[];
  sectors: { type: EntityType; label: string; x: number; y: number }[];
}

const SECTORS: { type: EntityType; label: string; angle: number }[] = [
  { type: 'school', label: 'Écoles et formations', angle: -Math.PI / 2 },
  { type: 'office', label: 'Fonctions publiques', angle: 0 },
  { type: 'organization', label: 'Entreprises et organisations', angle: Math.PI },
  { type: 'party', label: 'Partis et statuts', angle: Math.PI / 2 },
  { type: 'person', label: 'Personnalités', angle: -Math.PI / 4 },
];

function layoutSectors(focus: string, neighbors: Entity[], historyIds: string[], chronology: Chronology, xScale: number): GraphLayout {
  const positions: GraphLayout['positions'] = new Map([[focus, { x: 0, y: 0 }]]);
  const rings: GraphLayout['rings'] = [], unknownZones: GraphLayout['unknownZones'] = [], sectors: GraphLayout['sectors'] = [];
  const unknownIds = neighbors.filter(entity => chronology.nodes.get(entity.id)?.band === null).map(entity => entity.id);
  let outer = 300;
  for (let band = 0; band < TIME_BANDS.length; band++) {
    let bandOuter = 0;
    for (const sector of SECTORS) {
      const members = neighbors.filter(entity => entity.type === sector.type && chronology.nodes.get(entity.id)?.band === band);
      if (!members.length) continue;
      let offset = 0, radius = Math.max(900 + band * 300, outer + 300);
      while (offset < members.length) {
        const hasPeople = neighbors.some(entity => entity.type === 'person');
        const span = sector.type === 'person' ? .25 : sector.type === 'party' ? .6 : hasPeople && (sector.type === 'school' || sector.type === 'office') ? .7 : sector.type === 'office' || sector.type === 'organization' ? 1.1 : 1;
        const capacity = Math.max(1, Math.floor(radius * span / 240));
        const count = Math.min(capacity, members.length - offset);
        for (let i = 0; i < count; i++) {
          const angle = sector.angle + (count === 1 ? 0 : (i / (count - 1) - .5) * span);
          positions.set(members[offset + i].id, { x: Math.cos(angle) * radius * xScale, y: Math.sin(angle) * radius });
        }
        bandOuter = Math.max(bandOuter, radius);
        offset += count; radius += 300;
      }
    }
    if (bandOuter) { outer = bandOuter; rings.push({ radius: outer + 60, band }); }
  }
  for (const sector of SECTORS) {
    if (!neighbors.some(entity => entity.type === sector.type)) continue;
    const unknown = neighbors.filter(entity => entity.type === sector.type && unknownIds.includes(entity.id));
    const vertical = sector.type === 'school' || sector.type === 'party';
    const distance = outer + 480 + (xScale < 1.5 && sector.type === 'party' ? 260 : 0);
    let label = { x: Math.cos(sector.angle) * (outer + 190) * xScale, y: Math.sin(sector.angle) * (outer + 190) };
    if (unknown.length) {
      const stagger = vertical && xScale >= 1.5 && unknown.length >= 3;
      const columns = vertical ? Math.min(stagger ? 4 : 2, unknown.length) : Math.max(1, Math.ceil(Math.sqrt(unknown.length) / 2));
      const rows = Math.ceil(unknown.length / columns) + (stagger ? 1 : 0);
      // Side groups have room above and below the dated fan. Use it for names
      // instead of packing unknown functions into the gaps between its symbols.
      const stepX = 700 * xScale, stepY = vertical ? 600 : 1200;
      const centerX = Math.cos(sector.angle) * distance * xScale;
      const centerY = Math.sin(sector.angle) * distance;
      const startX = centerX - (columns - 1) * stepX / 2;
      const startY = centerY - (rows - 1) * stepY / 2;
      // Extend unknown dates away from the temporal scale, never into its rings.
      const dx = sector.type === 'organization' ? -(columns - 1) * stepX / 2 : sector.type === 'office' ? (columns - 1) * stepX / 2 : 0;
      const dy = sector.type === 'school' ? -(rows - 1) * stepY / 2 : sector.type === 'party' ? (rows - 1) * stepY / 2 : 0;
      unknown.forEach((entity, i) => positions.set(entity.id, { x: startX + dx + (i % columns) * stepX, y: startY + dy + (Math.floor(i / columns) + (stagger ? i % 2 : 0)) * stepY }));
      const zone = { x: startX + dx - 220 * xScale, y: startY + dy - 240, width: (columns - 1) * stepX + 440 * xScale, height: (rows - 1) * stepY + 480, type: sector.type };
      unknownZones.push(zone);
      label = { x: zone.x + zone.width / 2, y: zone.y - 170 };
    }
    sectors.push({ ...label, type: sector.type, label: sector.label });
  }
  // The exploration trail is a separate lane below the map, outside every sector.
  const historyY = Math.max(outer + 300, ...unknownZones.map(zone => zone.y + zone.height)) + 380;
  historyIds.forEach((id, i) => positions.set(id, { x: (i - (historyIds.length - 1) / 2) * 440 * xScale, y: historyY }));
  return { positions, rings, unknownIds, historyIds, unknownZones, sectors, xScale };
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

export function layoutGraph(graph: Graph, focus: string, trail: string[], chronology: Chronology, xScale = 3.5): GraphLayout {
  const positions: GraphLayout['positions'] = new Map([[focus, { x: 0, y: 0 }]]);
  const historyIds = trail.filter(id => id !== focus && graph.entities.some(entity => entity.id === id));
  const neighbors = graph.entities.filter(entity => entity.id !== focus && !historyIds.includes(entity.id)).sort((a, b) => a.label.localeCompare(b.label, 'fr') || a.id.localeCompare(b.id));
  if (neighbors.some(entity => entity.type !== 'person')) return layoutSectors(focus, neighbors, historyIds, chronology, xScale);
  const unknownIds = neighbors.filter(entity => chronology.nodes.get(entity.id)?.band === null).map(entity => entity.id);
  const rings: GraphLayout['rings'] = [];
  const spacious = graph.entities.length <= 28;
  let outer = 40;
  for (let band = 0; band < TIME_BANDS.length; band++) {
    const members = neighbors.filter(entity => chronology.nodes.get(entity.id)?.band === band);
    if (!members.length) continue;
    let offset = 0;
    let radius = spacious ? outer === 40 ? 330 : outer + 150 : outer + 140;
    while (offset < members.length) {
      const count = Math.min(members.length - offset, Math.max(6, Math.floor(2 * Math.PI * radius / (spacious ? 220 : 130))));
      for (let i = 0; i < count; i++) {
        // Stagger adjacent bands so large symbols do not stack on the same ray.
        const phase = spacious && rings.length % 2 ? -Math.PI / 6 : 0;
        const angle = -Math.PI / 2 + phase + i / count * Math.PI * 2 + (offset ? .16 : 0);
        positions.set(members[offset + i].id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
      offset += count;
      outer = radius;
      radius += spacious ? 180 : 120;
    }
    rings.push({ radius: outer + 60, band });
  }
  let unknownBox: GraphLayout['unknownZones'][number] | undefined;
  if (unknownIds.length) {
    const columns = Math.ceil(Math.sqrt(unknownIds.length));
    const rows = Math.ceil(unknownIds.length / columns);
    const stepX = spacious ? 500 : 130, stepY = spacious ? 320 : 110;
    const x = outer + (spacious ? 280 : 180);
    const y = -(rows - 1) * stepY / 2;
    unknownIds.forEach((id, index) => positions.set(id, { x: x + (index % columns) * stepX, y: y + Math.floor(index / columns) * stepY }));
    unknownBox = { x: x - stepX / 2, y: y - 75, width: columns * stepX, height: spacious ? (rows - 1) * stepY + 150 : rows * 110 + 25 };
  }
  // Navigation history is kept apart from the temporal scale.
  [...historyIds].reverse().forEach((id, i) => positions.set(id, { x: -(outer + 170 + i * 170), y: 0 }));
  return { positions, rings, unknownIds, historyIds, unknownZones: unknownBox ? [unknownBox] : [], sectors: [], xScale: 1 };
}
