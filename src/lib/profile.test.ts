import { expect, it } from 'vitest';
import { loadDataset } from './dataset';
import { getCareerTimeline, getPersonProfile } from './profile';
import type { GraphData, Relation } from './types';

it('keeps concurrent passages, incomplete bounds and every proof without inventing continuity', () => {
  const corpus = loadDataset();
  const person = corpus.entities.find(entity => entity.id === 'Q30527240')!;
  const base = corpus.relations.find(relation => relation.source === person.id && relation.category === 'office')!;
  const first = { ...base, id: 'first', start: { value: '2000-00-00', precision: 9 }, end: { value: '2004-00-00', precision: 9 }, pointInTime: undefined, cohort: undefined };
  const repeat = { ...first, id: 'repeat', start: { value: '2010-00-00', precision: 9 }, end: { value: '2012-00-00', precision: 9 } };
  const parallel = { ...first, id: 'parallel', category: 'employment', start: { value: '2001-04-00', precision: 10 }, end: undefined } as Relation;
  const lastOnly = { ...first, id: 'last', start: undefined, end: { value: '2014-05-06', precision: 11 } };
  const undated = { ...first, id: 'unknown', start: undefined, end: undefined };
  const data = { ...corpus, relations: [repeat, undated, first, parallel, { ...first, id: 'second-proof' }, lastOnly] } as GraphData;
  const timeline = getCareerTimeline(data, person);
  expect(timeline.dated.map(entry => entry.relations.map(relation => relation.id))).toEqual([['first', 'second-proof'], ['parallel'], ['repeat'], ['last']]);
  expect(timeline.undated[0].relations.map(relation => relation.id)).toEqual(['unknown']);
  expect(timeline.dated[1].relations[0].end).toBeUndefined();
  expect(timeline.dated[3].relations[0].start).toBeUndefined();
  expect(timeline.dated[1].relations[0].start?.precision).toBe(10);
});

it('explains Albane Gaillot through her documented mandate and keeps the undated education undated', () => {
  const data = loadDataset();
  const profile = getPersonProfile(data, data.entities.find(entity => entity.id === 'Q30527240')!);
  const mandate = profile.sections.find(section => section.category === 'office')!.facts.find(fact => fact.entity.id === 'Q3044918')!;
  expect(mandate.relation.start?.value).toBe('2017-06-21');
  expect(mandate.relation.end?.value).toBe('2022-06-21');
  const education = profile.sections.find(section => section.category === 'education')!.facts[0];
  expect(education.entity.id).toBe('Q662976');
  expect(education.relation.start).toBeUndefined();
  expect(education.relation.end).toBeUndefined();
  expect(profile.sections.every(section => section.facts.every(fact => data.relations.includes(fact.relation)))).toBe(true);
});

it('preserves an individual parliamentary term instead of joining successive terms', () => {
  const data = loadDataset();
  const person = data.entities.find(entity => entity.id === 'Q30527240')!;
  const source = data.relations.find(relation => relation.source === person.id && relation.category === 'office')!;
  const newer = { ...source, id: 'newer', start: { value: '2024-01-01', precision: 11 }, end: { value: '2025-01-01', precision: 11 } };
  const profile = getPersonProfile({ ...data, relations: [source, newer] }, person);
  const fact = profile.sections[0].facts[0];
  expect(fact.relation.start?.value).toBe('2024-01-01');
  expect(fact.relation.end?.value).toBe('2025-01-01');
  expect(fact.relation.id).toBe('newer');
});
