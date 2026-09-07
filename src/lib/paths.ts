import type { Category, Entity, GraphData, Relation } from './types';
import { getGraphIndex } from './graph-index';
import { supportsPeriods } from './temporal';
import { compareRelationsChronologically } from './chronology';
export interface InstitutionalPath { entities: Entity[]; segments: { from: string; to: string; relations: Relation[] }[] }
export function findInstitutionalPaths(data: GraphData, left: string, right: string, categories: Category[], options: { maxDepth?: number; maxResults?: number; maxWork?: number } = {}) {
  const bound = (value: number | undefined, ceiling: number) => Number.isFinite(value) ? Math.max(0, Math.min(ceiling, Math.floor(value!))) : ceiling;
  const maxDepth = bound(options.maxDepth, 4), maxResults = bound(options.maxResults, 3), maxWork = bound(options.maxWork, 20_000);
  const result = { paths: [] as InstitutionalPath[], examined: 0, limited: false, maxDepth };
  const index = getGraphIndex(data);
  if (left === right || index.entities.get(left)?.type !== 'person' || index.entities.get(right)?.type !== 'person' || !categories.length || !maxDepth || !maxResults) return result;
  const adjacency = new Map<string, { id: string; relations: Relation[] }[]>();
  function neighbors(id: string) {
    if (adjacency.has(id)) return adjacency.get(id)!;
    const grouped = new Map<string, Relation[]>();
    for (const relation of index.incident.get(id) ?? []) {
      if (!categories.includes(relation.category)) continue;
      const otherId = relation.source === id ? relation.target : relation.source;
      const other = index.entities.get(otherId), current = index.entities.get(id)!;
      if (!other || (other.type !== 'person' && !supportsPeriods(other))) continue;
      // Institutional paths alternate people and documented institutions, never a personal-proximity edge.
      if ((other.type === 'person') === (current.type === 'person')) continue;
      const statements = grouped.get(otherId);
      if (statements) statements.push(relation); else grouped.set(otherId, [relation]);
    }
    const entries = [...grouped].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([id, relations]) => ({ id, relations: relations.sort(compareRelationsChronologically) }));
    adjacency.set(id, entries);
    return entries;
  }
  const queue: { ids: string[]; segments: InstitutionalPath['segments'] }[] = [{ ids: [left], segments: [] }];
  const arrivals = new Map<string, number>([[left, 1]]);
  // Breadth first, with at most three arrivals per vertex and a strict traversal budget.
  // This is a bounded search for short examples, not enumeration of all simple paths.
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor];
    if (current.segments.length >= maxDepth) continue;
    const from = current.ids.at(-1)!;
    for (const next of neighbors(from)) {
      if (result.examined >= maxWork) return { ...result, limited: true };
      result.examined++;
      if (current.ids.includes(next.id)) continue;
      const ids = [...current.ids, next.id];
      const segments = [...current.segments, { from, to: next.id, relations: next.relations }];
      if (next.id === right) {
        result.paths.push({ entities: ids.map(id => index.entities.get(id)!), segments });
        if (result.paths.length === maxResults) return result;
      } else if (segments.length < maxDepth) {
        const count = arrivals.get(next.id) ?? 0;
        if (count >= maxResults) { result.limited = true; continue; }
        arrivals.set(next.id, count + 1);
        queue.push({ ids, segments });
      }
    }
  }
  return result;
}
