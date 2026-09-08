import type { SystemLayoutInput, SystemPositions } from './system-graph';

/** Reserve space for busy junctions using only the documented topology. */
export function separateSystemHubs(input: SystemLayoutInput, positions: SystemPositions): SystemPositions {
  const result = Object.fromEntries(Object.entries(positions).map(([id, position]) => [id, { ...position }]));
  const hubs = input.nodes.filter(node => node.degree >= 12).sort((a, b) => a.id.localeCompare(b.id));
  const radii = hubs.map(node => 28 + Math.min(140, Math.sqrt(node.degree) * 12));

  // The spring layout can leave almost identical neighbourhoods overlapping.
  // Relax just their clearances, retaining its orientation and overall shape.
  for (let pass = 0; pass < 80; pass++) {
    let largestOverlap = 0;
    for (let i = 0; i < hubs.length; i++) for (let j = i + 1; j < hubs.length; j++) {
      const a = result[hubs[i].id], b = result[hubs[j].id];
      const dx = b.x - a.x, dy = b.y - a.y;
      const distance = Math.hypot(dx, dy), overlap = radii[i] + radii[j] - distance;
      if (overlap <= 0) continue;
      largestOverlap = Math.max(largestOverlap, overlap);
      // A stable direction also handles two hubs at exactly the same point.
      const angle = (i * hubs.length + j) * 2.399963;
      const ux = distance > .001 ? dx / distance : Math.cos(angle);
      const uy = distance > .001 ? dy / distance : Math.sin(angle);
      const shift = (overlap + .1) / 2;
      a.x -= ux * shift; a.y -= uy * shift;
      b.x += ux * shift; b.y += uy * shift;
    }
    if (largestOverlap < .5) break;
  }

  const offsets = new Map(hubs.map(hub => [hub.id, {
    x: result[hub.id].x - positions[hub.id].x,
    y: result[hub.id].y - positions[hub.id].y,
  }]));
  const neighbours = new Map<string, Set<string>>();
  for (const edge of input.edges) {
    for (const [hub, neighbour] of [[edge.source, edge.target], [edge.target, edge.source]]) {
      if (!offsets.has(hub) || offsets.has(neighbour)) continue;
      const linked = neighbours.get(neighbour) ?? new Set<string>();
      linked.add(hub); neighbours.set(neighbour, linked);
    }
  }
  // A singly attached person follows that institution; shared people move by
  // the mean of their actual neighbours' displacements, never a chosen group.
  for (const [id, linked] of neighbours) {
    for (const hub of linked) {
      const offset = offsets.get(hub)!;
      result[id].x += offset.x / linked.size;
      result[id].y += offset.y / linked.size;
    }
  }
  return result;
}
