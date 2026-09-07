import { expect, it } from 'vitest';
import corpus from '../data/graph.json';
import { getVisibleGraph, parseView } from './graph';
import { getChronology, getTimeReference } from './graph-layout';
import { frameGraph, layoutInViewport, nodeDiameter } from './graph-viewport';
import type { GraphData } from './types';

it.each([
  { width: 650, height: 660, gap: 12 },
  { width: 1376, height: 448, gap: 6 },
  { width: 358, height: 550, gap: 4 },
])('leaves room between symbols in the Macron overview at $width × $height', ({ width, height, gap }) => {
  const data = corpus as GraphData;
  const view = parseView('?root=Q3052772&time=all', data);
  const graph = getVisibleGraph(data, view);
  const chronology = getChronology(graph, view.focus, getTimeReference(data, view));
  const layout = layoutInViewport(graph, view.focus, view.expanded, chronology, width, height);
  const { zoom } = frameGraph(layout, width, height);
  const nodes = [...layout.positions].map(([id, p]) => ({ id, x: p.x * zoom, y: p.y * zoom, radius: nodeDiameter(zoom, width >= 560, id === view.focus, 0, true) / 2 }));
  const collisions = nodes.flatMap((a, i) => nodes.slice(i + 1).filter(b =>
    Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) < a.radius + b.radius + gap,
  ).map(b => [a.id, b.id]));
  expect(collisions).toEqual([]);
  const ys = nodes.map(node => node.y);
  expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(height * .65);
});
