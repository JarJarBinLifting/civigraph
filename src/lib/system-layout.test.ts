import { expect, test } from 'vitest';
import { computeSystemLayout } from './system-layout';

test('the worker layout keeps every node finite across disconnected components and an isolate', () => {
  const nodes = ['a', 'b', 'c', 'd', 'e', 'alone'].map(id => ({ id, degree: id === 'alone' ? 0 : 1 }));
  const result = computeSystemLayout({ nodes, edges: [{ id: 'ab', source: 'a', target: 'b' }, { id: 'bc', source: 'b', target: 'c' }, { id: 'de', source: 'd', target: 'e' }] });
  expect(Object.keys(result).sort()).toEqual(nodes.map(n => n.id).sort());
  expect(Object.values(result).every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  expect(new Set(Object.values(result).map(p => `${p.x},${p.y}`)).size).toBe(nodes.length);
  expect(computeSystemLayout({ nodes: [], edges: [] })).toEqual({});
});
