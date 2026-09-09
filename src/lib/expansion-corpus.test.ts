import { expect, test } from 'vitest';
import names from '../../scripts/people-expansion.json';
import expansion from '../data/expansion-wikidata.json';
import assembly from '../data/expansion-assembly.json';
import official from '../data/expansion-official.json';
import { loadDataset } from './dataset';
import { searchEntities } from './graph';

test('all 16 approved additions are searchable, connected and backed by primary parliamentary evidence', () => {
  const data = loadDataset();
  const people = expansion.entities.filter(entity => entity.inCorpus);
  expect(people.map(person => person.label).sort()).toEqual([...names].sort());
  expect(people).toHaveLength(16);
  for (const person of people) {
    expect(data.entities.find(entity => entity.id === person.id)?.inCorpus, person.label).toBe(true);
    expect(searchEntities(data, person.label).some(entity => entity.id === person.id), person.label).toBe(true);
    expect(data.relations.some(relation => relation.source === person.id && relation.evidence?.kind === 'official'), person.label).toBe(true);
    const career = expansion.relations.filter(relation => relation.source === person.id);
    expect(career.length, person.label).toBeGreaterThan(0);
    for (const statement of career) {
      expect(statement.statementUrl).toContain(`${person.id}#`);
      expect(statement.revisionUrl).toMatch(/oldid=\d+/);
    }
  }
});

test('expansion snapshots retain their evidence in the runtime graph with valid endpoints', () => {
  const data = loadDataset();
  const ids = new Set(data.entities.map(entity => entity.id));
  const statements = new Map(data.relations.map(relation => [relation.id, relation]));
  expect(ids.size).toBe(data.entities.length);
  expect(statements.size).toBe(data.relations.length);
  for (const source of [expansion, assembly, official]) for (const relation of source.relations) {
    expect(ids.has(relation.source) && ids.has(relation.target), relation.id).toBe(true);
    expect(statements.get(relation.id), relation.id).toEqual(relation);
  }
  for (const relation of data.relations.filter(relation => relation.property === 'official:parliamentary-roster')) {
    expect(relation.start).toBeUndefined();
    expect(relation.end).toBeUndefined();
    expect(relation.pointInTime?.value).toBe(relation.evidence?.checkedAt);
  }
});
