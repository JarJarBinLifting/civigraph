import type { Entity, Relation, SourceDate } from './types';

export type Overlap = 'documented' | 'possible' | 'outside' | 'unknown';
function dateBounds(date?: SourceDate) {
  if (!date || date.precision < 9 || !/^\d{4}-\d{2}-\d{2}$/.test(date.value)) return null;
  const [year, month, day] = date.value.split('-').map(Number);
  if (!year || month > 12 || day > 31) return null;
  const stamp = (m: number, d: number) => {
    const value = new Date(0);
    value.setUTCFullYear(year, m - 1, d);
    value.setUTCHours(0, 0, 0, 0);
    return value.getTime();
  };
  if (date.precision === 9) return { first: stamp(1, 1), last: stamp(12, 31) };
  if (!month) return null;
  const lastDay = new Date(stamp(month + 1, 0)).getUTCDate();
  if (date.precision === 10) return { first: stamp(month, 1), last: stamp(month, lastDay) };
  if (!day || day > lastDay) return null;
  return { first: stamp(month, day), last: stamp(month, day) };
}

export function periodBounds(relation: Relation) {
  const start = dateBounds(relation.start);
  const end = dateBounds(relation.end);
  if (start && end) {
    if (start.first > end.last) return null;
    return { first: start.first, last: end.last, certainFirst: start.last, certainLast: end.first };
  }
  const point = dateBounds(relation.pointInTime);
  if (point) return { first: point.first, last: point.last, certainFirst: point.last, certainLast: point.first };
  return null;
}

export function comparePeriods(left: Relation, right: Relation): Overlap {
  const a = periodBounds(left);
  const b = periodBounds(right);
  if (!a || !b) return 'unknown';
  if (a.last < b.first || b.last < a.first) return 'outside';
  // A jointly sourced roster establishes one composition, even if only its year is known.
  if (left.evidence && right.evidence && left.target === right.target && left.cohort && left.cohort.id === right.cohort?.id) return 'documented';
  const guaranteedIntersection = Math.max(a.certainFirst, b.certainFirst) <= Math.min(a.certainLast, b.certainLast);
  const aContained = a.first >= b.certainFirst && a.last <= b.certainLast;
  const bContained = b.first >= a.certainFirst && b.last <= a.certainLast;
  return guaranteedIntersection || aContained || bContained ? 'documented' : 'possible';
}

export function supportsPeriods(entity: Entity) {
  return ['organization', 'school', 'party'].includes(entity.type) || (entity.type === 'office' && Boolean(entity.contexts?.length));
}
