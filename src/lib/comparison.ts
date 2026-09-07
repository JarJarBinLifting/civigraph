import type { CommonConnection, Relation } from './types';
import { periodLabel } from './presentation';
import { comparePeriods } from './temporal';
import { sortRelationsChronologically } from './chronology';

export function comparisonDateLabel(statements: Relation[]): string {
  return [...new Set(sortRelationsChronologically(statements).map(periodLabel))].join('\n');
}
export function comparisonPeriods(connection: CommonConnection) {
  const counts = { documented: 0, possible: 0, outside: 0, unknown: 0, total: 0 };
  for (const left of connection.left) for (const right of connection.right) {
    counts[comparePeriods(left, right)]++;
    counts.total++;
  }
  return counts;
}
