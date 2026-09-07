import { layoutGraph, type Chronology, type GraphLayout } from './graph-layout';
import type { GraphData } from './types';

export function nodeDiameter(zoom: number, prominent: boolean, root: boolean, priority = 0, compact = false) {
  if (root) return prominent ? Math.max(compact ? 60 : 68, Math.min(88, 150 * zoom)) : 52;
  return prominent ? Math.max(compact ? 34 : 40, Math.min(54, 104 * zoom)) : Math.max(priority >= 60 ? 30 : 18, Math.min(52, 64 * zoom));
}

export function layoutInViewport(graph: Pick<GraphData, 'entities' | 'relations'>, focus: string, trail: string[], chronology: Chronology, width: number, height: number) {
  // Reserve horizontal space for names beside the outer symbols. The profile
  // reduces the canvas width; the full window aspect ratio cannot describe it.
  // Small networks keep a compact atlas shape on wide screens; stretching every
  // sector to the full width otherwise flattens the rings and crowds the center.
  const maxScale = graph.entities.length <= 28 ? 1.8 : 3.5;
  const xScale = Math.max(.65, Math.min(maxScale, (width - 140) / height));
  return layoutGraph(graph, focus, trail, chronology, xScale);
}

export function frameGraph(layout: GraphLayout, width: number, height: number) {
  const { positions } = layout;
  // Fit factual positions and guides first. Screen-sized labels adapt to this viewport,
  // rather than shrinking the entire network to make room for a peripheral name.
  const radius = Math.max(60, ...layout.rings.map(ring => ring.radius));
  let x1 = -radius * layout.xScale, x2 = radius * layout.xScale, y1 = -radius, y2 = radius;
  for (const box of layout.unknownZones) {
    x1 = Math.min(x1, box.x); x2 = Math.max(x2, box.x + box.width); y1 = Math.min(y1, box.y - 170); y2 = Math.max(y2, box.y + box.height);
  }
  for (const sector of layout.sectors) { x1 = Math.min(x1, sector.x); x2 = Math.max(x2, sector.x); y1 = Math.min(y1, sector.y); y2 = Math.max(y2, sector.y); }
  for (const point of positions.values()) { x1 = Math.min(x1, point.x); x2 = Math.max(x2, point.x); y1 = Math.min(y1, point.y); y2 = Math.max(y2, point.y); }
  // Balance the actual extent, including unknown dates and the navigation trail.
  // Mirroring that extent around the focus wastes half the width on small networks.
  const center = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  const zoom = Math.max(.02, Math.min((width - 58) / (x2 - x1), (height - 82) / (y2 - y1), 1.1));
  return { zoom, pan: { x: width / 2 - center.x * zoom, y: height / 2 - center.y * zoom } };
}
