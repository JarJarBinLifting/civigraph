import { expect, test } from 'vitest';
import { findInstitutionalPaths } from './paths';
import { parseView, serializeView } from './graph';
import { CATEGORIES, type Entity, type GraphData, type Relation } from './types';
const entity = (id: string, type: Entity['type']): Entity => ({ id, label: id, type, description: '', inCorpus: type === 'person', modified: '' });
const relation = (id: string, source: string, target: string, category: Relation['category'] = 'education'): Relation => ({ id, source, target, category, property: 'P69', label: 'A étudié à', statementUrl: `https://www.wikidata.org/wiki/${source}#${id}`, references: [] });
const data: GraphData = { meta: { version: 1, fetchedAt: '2026-09-06', source: '', license: '', peopleCount: 4, entityCount: 8, relationCount: 10, properties: [], description: '' },
  entities: [entity('A', 'person'), entity('B', 'person'), entity('C', 'person'), entity('D', 'person'), entity('S1', 'school'), entity('S2', 'school'), entity('S3', 'school'), entity('G', 'office')],
  relations: [relation('a1', 'A', 'S1'), relation('a1bis', 'A', 'S1'), relation('b1', 'B', 'S1'), relation('a2', 'A', 'S2'), relation('c2', 'C', 'S2'), relation('c3', 'C', 'S3'), relation('b3', 'B', 'S3'), relation('ag', 'A', 'G', 'office'), relation('bg', 'B', 'G', 'office'), relation('d3', 'D', 'S3')],
};
test('returns direct and indirect structural paths once, with original directions and parallel proofs', () => {
  const result = findInstitutionalPaths(data, 'A', 'B', [...CATEGORIES]);
  expect(result.paths.map(path => path.entities.map(item => item.id))).toEqual([['A', 'S1', 'B'], ['A', 'S2', 'C', 'S3', 'B']]);
  expect(result.paths[0].segments[0].relations.map(item => item.id)).toEqual(['a1', 'a1bis']);
  expect(result.paths[0].segments[1].relations[0]).toMatchObject({ source: 'B', target: 'S1', id: 'b1' });
  expect(findInstitutionalPaths({ ...data, relations: [...data.relations].reverse() }, 'A', 'B', [...CATEGORIES]).paths.map(path => path.entities.map(item => item.id))).toEqual([['A', 'S1', 'B'], ['A', 'S2', 'C', 'S3', 'B']]);
});
test('respects categories, identity validation, depth and an explicit work budget', () => {
  for (const [left, right, categories] of [['A', 'A', [...CATEGORIES]], ['missing', 'B', [...CATEGORIES]], ['A', 'B', []], ['A', 'B', ['office']]] as const) expect(findInstitutionalPaths(data, left, right, [...categories]).paths).toEqual([]);
  expect(findInstitutionalPaths(data, 'A', 'B', [...CATEGORIES], { maxDepth: 1 }).paths).toEqual([]);
  expect(findInstitutionalPaths(data, 'A', 'B', [...CATEGORIES], { maxDepth: 2 }).paths).toHaveLength(1);
  const limited = findInstitutionalPaths(data, 'A', 'B', [...CATEGORIES], { maxWork: 1 });
  expect(limited.examined).toBeLessThanOrEqual(1);
  expect(limited.limited).toBe(true);
});
test('contextual offices remain available and cycles never repeat an entity', () => {
  const contextual = { ...data, entities: data.entities.map(item => item.id === 'G' ? { ...item, contexts: [{ id: 'S1', label: 'S1', property: 'P642', revision: 1 }] } : item) };
  expect(findInstitutionalPaths(contextual, 'A', 'B', ['office']).paths[0].entities.map(item => item.id)).toEqual(['A', 'G', 'B']);
  const result = findInstitutionalPaths(data, 'A', 'B', [...CATEGORIES]);
  for (const path of result.paths) expect(new Set(path.entities.map(item => item.id)).size).toBe(path.entities.length);
});
test('never exceeds three paths or four segments even when requested limits are larger', () => {
  const schools = Array.from({ length: 8 }, (_, i) => entity(`T${i}`, 'school'));
  const dense = { ...data, entities: [...data.entities, ...schools], relations: [...data.relations, ...schools.flatMap(item => [relation(`a${item.id}`, 'A', item.id), relation(`b${item.id}`, 'B', item.id)])] };
  const result = findInstitutionalPaths(dense, 'A', 'B', [...CATEGORIES], { maxResults: 99, maxDepth: 99 });
  expect(result.paths).toHaveLength(3);
  expect(result.paths.every(path => path.segments.length <= 4)).toBe(true);
});
test('paths mode shares independently of the explorer list mode and tolerates old URLs', () => {
  const view = parseView('?root=A&compare=B&comparisonMode=paths&mode=list', data);
  expect(view).toMatchObject({ comparisonMode: 'paths', mode: 'list' });
  expect(parseView(serializeView(view), data)).toEqual(view);
  expect(parseView('?root=A&compare=B', data).comparisonMode).toBeUndefined();
});
