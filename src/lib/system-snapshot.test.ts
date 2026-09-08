import { expect, test } from 'vitest';
import snapshot from '../data/system-layout.json';
import { loadDataset } from './dataset';
import { CATEGORIES } from './types';
import { getSystemGraph, matchingSystemPositions } from './system-graph';

test('the shipped layout matches the complete current corpus and rejects stale or incomplete geometry', async () => {
  const data = loadDataset();
  const graph = getSystemGraph(data, { categories: [...CATEGORIES], temporal: 'all', period: null, selected: data.entities[0].id });
  const prepared = await matchingSystemPositions(graph, snapshot);
  expect(prepared, 'Refresh geometry with npm run data:layout after a corpus topology change').toEqual(snapshot.positions);
  expect(prepared).not.toBe(snapshot.positions);
  expect(Object.keys(prepared!)).toHaveLength(data.entities.length);
  expect(await matchingSystemPositions(graph, { ...snapshot, topologyHash: 'stale' })).toBeUndefined();
  expect(await matchingSystemPositions(graph, { ...snapshot, positions: {} })).toBeUndefined();
  expect(await matchingSystemPositions(graph, { ...snapshot, positions: { ...snapshot.positions, [graph.entities[0].id]: { x: NaN, y: 0 } } })).toBeUndefined();
});

test('the overview leaves distinguishable space between its busiest hubs after fitting the whole corpus', () => {
  const data = loadDataset();
  const graph = getSystemGraph(data, { categories: [...CATEGORIES], temporal: 'all', period: null, selected: data.entities[0].id });
  const positions: Record<string, { x: number; y: number }> = snapshot.positions;
  const points = Object.values(positions);
  // Compare screen space, so uniformly enlarging every coordinate cannot pass.
  const scale = Math.min(
    1100 / (Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))),
    600 / (Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))),
  );
  const hubs = [...graph.entities].sort((a, b) => graph.neighbors.get(b.id)!.size - graph.neighbors.get(a.id)!.size).slice(0, 20);
  const gaps = hubs.map(hub => Math.min(...hubs.filter(other => other.id !== hub.id).map(other =>
    Math.hypot(positions[hub.id].x - positions[other.id].x, positions[hub.id].y - positions[other.id].y) * scale,
  ))).sort((a, b) => a - b);
  // The largest ordinary symbols are 10 px across: keep them separate and
  // leave at least 24 px around the typical hub in this reference viewport.
  expect(gaps[0]).toBeGreaterThan(12);
  expect(gaps[Math.floor(gaps.length / 2)]).toBeGreaterThan(24);
});
