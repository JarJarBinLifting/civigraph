import { expect, test } from 'vitest';
import roster from '../../scripts/people-2026.json';
import { loadDataset } from './dataset';
import { searchEntities } from './graph';
import original from '../data/graph.json';
import network from '../data/network-wikidata.json';
import assembly from '../data/assembly.json';
import integrity from '../data/integrity-watch.json';

test('every reviewed 2026 identity is searchable and connected to its evidence', () => {
  const data = loadDataset();
  for (const person of roster.people) {
    expect(data.entities.find(entity => entity.id === person.id)?.inCorpus, person.name).toBe(true);
    expect(searchEntities(data, person.wikipediaTitle.split(' (')[0]).some(entity => entity.id === person.id), person.name).toBe(true);
    for (const role of person.roles) {
      expect(data.relations.some(relation => relation.source === person.id && relation.role === role.role && relation.statementUrl === role.url), person.name).toBe(true);
    }
  }
});

test('adding the current roster preserves previous evidence and has no dangling edges', () => {
  const data = loadDataset();
  const ids = new Set(data.entities.map(entity => entity.id));
  const relations = new Map(data.relations.map(relation => [relation.id, relation]));
  expect(ids.size).toBe(data.entities.length);
  expect(relations.size).toBe(data.relations.length);
  for (const relation of data.relations) {
    expect(ids.has(relation.source) && ids.has(relation.target), relation.id).toBe(true);
  }
  for (const snapshot of [original, network, assembly, integrity]) {
    for (const relation of snapshot.relations) expect(relations.has(relation.id), relation.id).toBe(true);
  }
  for (const relation of original.relations) expect(relations.get(relation.id)).toEqual(relation);
});

test('2026 attestations carry a point date, never invented tenure bounds', () => {
  const relations = loadDataset().relations.filter(relation => relation.property === 'official:2026-role');
  expect(relations).toHaveLength(roster.people.reduce((count, person) => count + person.roles.length, 0));
  for (const relation of relations) {
    expect(relation.pointInTime).toEqual({ value: roster.checkedAt, precision: 11 });
    expect(relation.start).toBeUndefined();
    expect(relation.end).toBeUndefined();
    expect(relation.evidence?.checkedAt).toBe(roster.checkedAt);
  }
});
