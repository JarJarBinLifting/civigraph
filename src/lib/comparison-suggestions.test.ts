import { expect, test } from 'vitest';
import { getComparisonSuggestions } from './comparison-suggestions';
import { CATEGORIES, type Entity, type GraphData, type Relation } from './types';

const entity = (id: string, type: Entity['type'] = 'person'): Entity => ({ id, label: id, type, inCorpus: true, description: '', modified: '' });
const relation = (id: string, source: string, target: string, start = 2000, end = 2005): Relation => ({
  id, source, target, category: 'education', property: 'P69', label: 'A étudié à', references: [], statementUrl: 'https://example.org',
  start: { value: `${start}-00-00`, precision: 9 }, end: { value: `${end}-00-00`, precision: 9 },
});
const entities = ['A', 'B', 'C', 'D'].map(id => entity(id)).concat([entity('school', 'school'), entity('other', 'school'), entity('role', 'office'), entity('Q327591', 'party')]);
const fixture = (relations: Relation[]) => ({ entities, relations } as GraphData);

test('counts distinct shared institutions and ignores duplicate evidence when ranking', () => {
  const data = fixture([relation('a1', 'A', 'school'), relation('a2', 'A', 'other'), relation('b1', 'B', 'school'),
    ...Array.from({ length: 50 }, (_, i) => relation(`duplicate-${i}`, 'B', 'school')),
    relation('c1', 'C', 'school'), relation('c2', 'C', 'other')]);
  const suggestions = getComparisonSuggestions(data, 'A', [...CATEGORIES]);
  expect(suggestions.map(item => [item.person.id, item.connections.length, item.sharedPeriodCount])).toEqual([['C', 2, 2], ['B', 1, 1]]);
  expect(suggestions[1].connections[0].right).toHaveLength(51);
});

test('does not promote uncertain or missing dates to documented coexistence', () => {
  const unknown = { ...relation('d', 'D', 'school'), start: undefined, end: undefined };
  const data = fixture([relation('a', 'A', 'school'), relation('b', 'B', 'school', 2005, 2008), relation('c', 'C', 'school', 2001, 2004), unknown]);
  expect(getComparisonSuggestions(data, 'A', ['education']).map(item => [item.person.id, item.sharedPeriodCount])).toEqual([['C', 1], ['B', 0], ['D', 0]]);
});

test('respects categories, excludes self, generic roles and independent political status', () => {
  const data = fixture([relation('a', 'A', 'school'), relation('b', 'B', 'school'), relation('ar', 'A', 'role'), relation('cr', 'C', 'role'),
    relation('as', 'A', 'Q327591'), relation('ds', 'D', 'Q327591')]);
  expect(getComparisonSuggestions(data, 'A', ['education']).map(item => item.person.id)).toEqual(['B']);
  expect(getComparisonSuggestions(data, 'A', ['office'])).toEqual([]);
  expect(getComparisonSuggestions(data, 'A', [])).toEqual([]);
  expect(getComparisonSuggestions(data, 'missing', [...CATEGORIES])).toEqual([]);
});

test('uses the new reference person and has deterministic ordering independent of import order', () => {
  const relations = [relation('a', 'A', 'school'), relation('b', 'B', 'school'), relation('c', 'C', 'other'), relation('d', 'D', 'other')];
  expect(getComparisonSuggestions(fixture(relations), 'C', ['education']).map(item => item.person.id)).toEqual(['D']);
  const original = getComparisonSuggestions(fixture(relations), 'A', ['education']);
  expect(getComparisonSuggestions(fixture([...relations].reverse()), 'A', ['education'])).toEqual(original);
});
