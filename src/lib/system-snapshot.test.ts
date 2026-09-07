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
