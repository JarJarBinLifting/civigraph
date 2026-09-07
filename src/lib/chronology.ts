import type { Relation } from './types';
import { dateBounds, periodBounds } from './temporal';

// A sorting anchor is not a complete participation period: an end alone stays an end.
export function relationSortDate(relation: Relation): number | null {
  if (relation.start && relation.end && !periodBounds(relation)) return null;
  return (dateBounds(relation.start) ?? dateBounds(relation.pointInTime) ?? dateBounds(relation.end))?.first ?? null;
}

export function compareRelationsChronologically(a: Relation, b: Relation): number {
  const first = relationSortDate(a), second = relationSortDate(b);
  if (first === null && second === null) return a.id.localeCompare(b.id, 'en');
  return (first ?? Infinity) - (second ?? Infinity)
    || (dateBounds(a.end)?.last ?? Infinity) - (dateBounds(b.end)?.last ?? Infinity)
    || a.id.localeCompare(b.id, 'en');
}

export function sortRelationsChronologically(relations: readonly Relation[]): Relation[] {
  return [...relations].sort(compareRelationsChronologically);
}
