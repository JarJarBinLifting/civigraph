import { expect, it } from 'vitest';
import { getChronology, getTimeReference, layoutGraph } from './graph-layout';
import { parseView, serializeView } from './graph';
import type { GraphData, Relation } from './types';

const ids = ['school', 'entry', 'near', 'middle', 'far', 'ancient', 'future', 'undated', 'repeat'];
const point = (source: string, year?: number): Relation => ({ id: `${source}-${year}`, source, target: 'school', category: 'education', property: 'P69', label: 'A étudié à', statementUrl: 'https://example.org', references: [], ...(year ? { pointInTime: { value: `${year}-00-00`, precision: 9 } } : {}) });
const data: GraphData = { meta: { version: 1, fetchedAt: '2026-09-06', source: '', license: '', description: '', entityCount: ids.length, peopleCount: 8, relationCount: 9, properties: ['P69'] }, entities: ids.map(id => ({ id, label: id, type: id === 'school' ? 'school' : 'person', description: '', inCorpus: id !== 'school', modified: '' })), relations: [point('entry'), point('near', 1999), point('middle', 1980), point('far', 1950), point('ancient', 1900), point('future', 2025), { ...point('undated'), end: { value: '1990-00-00', precision: 9 } }, point('repeat', 1950), point('repeat', 2001)] };
const view = parseView('?root=entry&focus=school&expanded=entry,school&time=all&year=2000', data);

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
