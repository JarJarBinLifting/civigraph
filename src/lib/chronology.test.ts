import { expect, test } from 'vitest';
import { sortRelationsChronologically } from './chronology';
import { loadDataset } from './dataset';
import type { Relation } from './types';

const passage = (id: string, dates: Partial<Relation> = {}): Relation => ({
  id, source: 'person', target: 'institution', category: 'membership', property: 'P463',
  label: 'Membre', statementUrl: 'https://example.org', references: [], ...dates,
});
const date = (value: string, precision = 11) => ({ value, precision });

test('orders by the available start, point or end date without mutating the source', () => {
  const input = [passage('unknown'), passage('recent', { start: date('2026-06-04') }),
    passage('point', { pointInTime: date('2021-05-07') }), passage('end-only', { end: date('2020-00-00', 9) }),
    passage('old', { start: date('2018-01-12'), end: date('2018-01-22') })];
  const original = [...input];
  expect(sortRelationsChronologically(input).map(item => item.id)).toEqual(['old', 'end-only', 'point', 'recent', 'unknown']);
  expect(input).toEqual(original);
  expect(input[3].start).toBeUndefined();
});

test('keeps imprecise or invalid periods at the end and orders equal starts by end then id', () => {
  const input = [passage('invalid', { start: date('2025-01-01'), end: date('2020-01-01') }),
    passage('approximate', { start: date('1900-00-00', 7) }),
    passage('b', { start: date('2020-01-01'), end: date('2021-01-01') }),
    passage('long', { start: date('2020-01-01'), end: date('2022-01-01') }),
    passage('a', { start: date('2020-01-01'), end: date('2021-01-01') })];
  expect(sortRelationsChronologically(input).map(item => item.id)).toEqual(['a', 'b', 'long', 'approximate', 'invalid']);
});

test('sorts the economic affairs commission passages without dropping any source or role', () => {
  const relations = loadDataset().relations.filter(item => item.target === 'AN:PO419610');
  expect(relations.length).toBeGreaterThan(100);
  const sorted = sortRelationsChronologically(relations);
  const dated = sorted.filter(item => item.start).map(item => item.start!.value);
  expect(dated).toEqual([...dated].sort());
  expect(new Set(sorted)).toEqual(new Set(relations));
});
