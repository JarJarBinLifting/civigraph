import { expect, it } from 'vitest';
import { getChronology, getTimeReference, layoutGraph } from './graph-layout';
import { parseView, serializeView } from './graph';
import type { GraphData, Relation } from './types';

const ids = ['school', 'entry', 'near', 'middle', 'far', 'ancient', 'future', 'undated', 'repeat'];
const point = (source: string, year?: number): Relation => ({ id: `${source}-${year}`, source, target: 'school', category: 'education', property: 'P69', label: 'A étudié à', statementUrl: 'https://example.org', references: [], ...(year ? { pointInTime: { value: `${year}-00-00`, precision: 9 } } : {}) });
const data: GraphData = { meta: { version: 1, fetchedAt: '2026-09-06', source: '', license: '', description: '', entityCount: ids.length, peopleCount: 8, relationCount: 9, properties: ['P69'] }, entities: ids.map(id => ({ id, label: id, type: id === 'school' ? 'school' : 'person', description: '', inCorpus: id !== 'school', modified: '' })), relations: [point('entry'), point('near', 1999), point('middle', 1980), point('far', 1950), point('ancient', 1900), point('future', 2025), { ...point('undated'), end: { value: '1990-00-00', precision: 9 } }, point('repeat', 1950), point('repeat', 2001)] };
const view = parseView('?root=entry&focus=school&expanded=entry,school&time=all&year=2000', data);

it('keeps each institution type on its side for dated and undated evidence, also after filtering', () => {
  const types = ['school', 'office', 'organization', 'party'] as const;
  const entities = [data.entities[1], ...types.flatMap(type => ['dated', 'unknown'].map(kind => ({ ...data.entities[0], id: `${type}-${kind}`, type })))];
  const graph = { entities, relations: [] };
  const chronology = { reference: getTimeReference(data, view), counts: [4, 0, 0, 0], unknown: 4,
    nodes: new Map(entities.slice(1).map(entity => [entity.id, { band: entity.id.endsWith('unknown') ? null : 0, gap: entity.id.endsWith('unknown') ? null : 2 }])) };
  for (const subset of [graph, { ...graph, entities: entities.filter(entity => entity.type !== 'office') }]) {
    const layout = layoutGraph(subset, 'entry', ['entry'], chronology);
    expect(layout.positions.size).toBe(subset.entities.length);
    for (const entity of subset.entities.filter(entity => entity.id !== 'entry')) {
      const p = layout.positions.get(entity.id)!;
      if (entity.type === 'school') expect(p.y).toBeLessThan(0);
      if (entity.type === 'party') expect(p.y).toBeGreaterThan(0);
      if (entity.type === 'organization') expect(p.x).toBeLessThan(0);
      if (entity.type === 'office') expect(p.x).toBeGreaterThan(0);
      if (entity.id.endsWith('unknown')) {
        const zone = layout.unknownZones.find(zone => zone.type === entity.type)!;
        expect(p.x).toBeGreaterThan(zone.x); expect(p.x).toBeLessThan(zone.x + zone.width);
        expect(p.y).toBeGreaterThan(zone.y); expect(p.y).toBeLessThan(zone.y + zone.height);
        expect(Math.hypot(p.x / layout.xScale, p.y)).toBeGreaterThan(Math.max(...layout.rings.map(ring => ring.radius)));
      }
    }
  }
});

it('places older or later periods farther out, while leaving incomplete dates outside the time scale', () => {
  const chronology = getChronology(data, view.focus, getTimeReference(data, view));
  expect(chronology.nodes.get('near')?.band).toBe(0);
  expect(chronology.nodes.get('middle')?.band).toBe(1);
  expect(chronology.nodes.get('far')?.band).toBe(2);
  expect(chronology.nodes.get('ancient')?.band).toBe(3);
  expect(chronology.nodes.get('future')?.band).toBe(2);
  expect(chronology.nodes.get('repeat')?.band).toBe(0);
  expect(chronology.nodes.get('undated')?.band).toBeNull();
  const layout = layoutGraph(data, view.focus, view.expanded, chronology);
  expect(layout.positions.size).toBe(9);
  const radius = (id: string) => Math.hypot(layout.positions.get(id)!.x, layout.positions.get(id)!.y);
  expect(radius('near')).toBeLessThan(radius('middle'));
  expect(radius('middle')).toBeLessThan(radius('far'));
  expect(radius('far')).toBeLessThan(radius('ancient'));
  expect(layout.positions.get('school')).toEqual({ x: 0, y: 0 });
  expect(layout.unknownIds).toContain('undated');
  expect(layout.historyIds).toContain('entry');
});

it('uses an explicit shared year or a documented passage without borrowing an unknown entry date', () => {
  expect(getTimeReference(data, view).label).toBe('2000');
  expect(parseView(serializeView(view), data).year).toBe(2000);
  expect(serializeView(view)).not.toContain('page=');
  expect(getTimeReference(data, { ...view, year: null, period: null }).label).toBe('2026');
  expect(getTimeReference(data, { ...view, year: null, period: 'far-1950' }).kind).toBe('passage');
  expect(parseView('?year=0', data).year).toBeNull();
  expect(parseView('?year=invalid&page=3', data).year).toBeNull();
});
