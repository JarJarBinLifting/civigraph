import type { CommonConnection } from './types';
import { comparePeriods } from './temporal';
export function comparisonPeriods(connection: CommonConnection) {
  const counts = { documented: 0, possible: 0, outside: 0, unknown: 0, total: 0 };
  for (const left of connection.left) for (const right of connection.right) {
    counts[comparePeriods(left, right)]++;
    counts.total++;
  }
  return counts;
}
