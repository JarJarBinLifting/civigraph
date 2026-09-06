import { expect, test } from 'vitest';
import { comparisonPeriods } from './comparison';
import type { CommonConnection, Relation } from './types';
function passage(id: string, start?: number, end?: number): Relation {
  return { id, source: id, target: 'school', category: 'education', property: 'P69', label: 'A étudié à', statementUrl: 'https://www.wikidata.org/', references: [], ...(start ? { start: { value: `${start}-00-00`, precision: 9 } } : {}), ...(end ? { end: { value: `${end}-00-00`, precision: 9 } } : {}) };
}
test('a documented pair never labels unrelated or undated passages as simultaneous', () => {
  const connection = { entity: { id: 'school' }, left: [passage('a', 2000, 2005), passage('b')], right: [passage('c', 2002, 2004), passage('d', 2010, 2012)] } as CommonConnection;
  expect(comparisonPeriods(connection)).toEqual({ documented: 1, outside: 1, possible: 0, unknown: 2, total: 4 });
});
test('a shared boundary year stays possible rather than documented', () => {
  const connection = { entity: { id: 'school' }, left: [passage('a', 2000, 2005)], right: [passage('b', 2005, 2008)] } as CommonConnection;
  expect(comparisonPeriods(connection)).toEqual({ documented: 0, outside: 0, possible: 1, unknown: 0, total: 1 });
});
