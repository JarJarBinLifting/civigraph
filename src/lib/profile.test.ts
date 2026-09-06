import { expect, it } from 'vitest';
import { loadDataset } from './dataset';
import { getPersonProfile } from './profile';

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
