import { expect, test } from 'vitest';
import { separateSystemHubs } from './system-layout-spacing';
import type { SystemLayoutInput, SystemPositions } from './system-graph';

test('separates coincident hubs and moves their actual neighbours with them without assigning shared people to a group', () => {
  const input: SystemLayoutInput = { nodes: [{ id: 'a', degree: 12 }, { id: 'b', degree: 12 }, { id: 'shared', degree: 2 }, { id: 'alone', degree: 0 }], edges: [
    { id: 'as', source: 'a', target: 'shared' }, { id: 'bs', source: 'b', target: 'shared' },
  ] };
  const positions: SystemPositions = { a: { x: 0, y: 0 }, b: { x: 0, y: 0 }, shared: { x: 10, y: 5 }, alone: { x: 500, y: 500 } };
  for (const hub of ['a', 'b']) for (let i = 0; i < 11; i++) {
    const id = `${hub}-${i}`;
    input.nodes.push({ id, degree: 1 });
    // Deliberately alternate direction: spacing uses undirected neighbours.
    input.edges.push({ id, source: i % 2 ? id : hub, target: i % 2 ? hub : id });
    positions[id] = { x: i + 20, y: 30 };
  }
  const before = structuredClone({ input, positions });
  const result = separateSystemHubs(input, positions);
  expect(Math.hypot(result.a.x - result.b.x, result.a.y - result.b.y)).toBeGreaterThan(80);
  for (const hub of ['a', 'b']) for (let i = 0; i < 11; i++) {
    expect(result[`${hub}-${i}`].x - result[hub].x).toBeCloseTo(i + 20);
    expect(result[`${hub}-${i}`].y - result[hub].y).toBeCloseTo(30);
  }
  expect(result.shared.x).toBeCloseTo(10 + (result.a.x + result.b.x) / 2);
  expect(result.shared.y).toBeCloseTo(5 + (result.a.y + result.b.y) / 2);
  expect(result.alone).toEqual({ x: 500, y: 500 });
  expect(Object.keys(result).sort()).toEqual(Object.keys(positions).sort());
  expect({ input, positions }).toEqual(before);
  expect(separateSystemHubs(input, positions)).toEqual(result);
});

test('leaves already separated components and small networks in place', () => {
  const input: SystemLayoutInput = { nodes: [{ id: 'a', degree: 20 }, { id: 'b', degree: 20 }, { id: 'small', degree: 1 }], edges: [] };
  const positions = { a: { x: -500, y: 0 }, b: { x: 500, y: 0 }, small: { x: 5, y: 10 } };
  expect(separateSystemHubs(input, positions)).toEqual(positions);
  expect(separateSystemHubs({ nodes: [], edges: [] }, {})).toEqual({});
});
