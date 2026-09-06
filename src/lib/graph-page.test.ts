import { expect, it } from 'vitest';
import { focusView, getGraphPage, parseView, serializeView } from './graph';
import type { GraphData } from './types';

const ids = ['root', 'school', ...Array.from({ length: 50 }, (_, i) => `person-${String(i).padStart(2, '0')}`)];
const data = { meta: {}, entities: ids.map(id => ({ id, label: id, type: id === 'school' ? 'school' : 'person', inCorpus: id !== 'school' })), relations: ids.filter(id => id !== 'school').map(id => ({ id: `edge-${id}`, source: id, target: 'school', category: 'education' })) } as GraphData;
const view = parseView('?root=root&focus=school&expanded=root,school', data);

it('makes every neighbor reachable in bounded pages and keeps the previous link on each page', () => {
  const ids = new Set<string>();
  const first = getGraphPage(data, view);
  expect(first.pageCount).toBeGreaterThan(1);
  for (let page = 0; page < first.pageCount; page++) {
    const graph = getGraphPage(data, { ...view, page });
    expect(graph.entities.length).toBeLessThanOrEqual(20);
    expect(graph.relations.some(relation => relation.id === 'edge-root')).toBe(true);
    const shown = new Set(graph.entities.map(entity => entity.id));
    expect(graph.relations.every(relation => shown.has(relation.source) && shown.has(relation.target))).toBe(true);
    graph.entities.forEach(entity => ids.add(entity.id));
  }
  expect(ids.size).toBe(data.entities.length);
  expect(getGraphPage(data, { ...view, page: 999 }).page).toBe(first.pageCount - 1);
});

it('restores the chosen page and returns to the first one when pivoting', () => {
  const next = { ...view, page: 2 };
  expect(parseView(serializeView(next), data)).toEqual(next);
  expect(focusView(next, 'person-03', data).page).toBe(0);
  expect(parseView('?page=-1', data).page).toBe(0);
});
