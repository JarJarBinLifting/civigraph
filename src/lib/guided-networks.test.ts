import { expect, test } from 'vitest';
import { loadDataset } from './dataset';
import { cohortGroups, laterPassages, crossingPairs } from './guided-networks';
import { parseView, serializeView } from './graph';
import type { Relation } from './types';

const data = loadDataset();
test('only an explicit official cohort establishes promotion membership', () => {
  const groups = cohortGroups(data);
  const senghor = groups.find(g => g.id === 'ena-senghor-2004')!;
  expect(senghor.members.map(m => m.person.id)).toContain('Q3052772');
  expect(senghor.members).toHaveLength(4);
  const unrelated: Relation = { ...senghor.members[0].relations[0], id: 'unrelated', source: 'Q364315', cohort: undefined };
  expect(cohortGroups({ ...data, relations: [...data.relations, unrelated] }).find(g => g.id === senghor.id)?.members).toHaveLength(4);
});
test('cabinet rosters preserve distinct teams and a documented transition', () => {
  const teams = cohortGroups(data).filter(g => g.kind === 'cabinet');
  expect(teams).toHaveLength(2);
  const old = teams.find(g => g.id === 'bercy-moscovici-2012')!;
  const kohler = old.members.find(m => m.person.label === 'Alexis Kohler')!;
  expect(laterPassages(data, kohler.person.id, old).some(r => r.cohort?.id === 'bercy-macron-2014')).toBe(true);
  expect(old.members.find(m => m.person.label === 'Cédric O')?.person.id).toBe('Q33103571');
  expect(data.entities.filter(e => e.label === 'Cédric O')).toHaveLength(1);
});
test('later passages exclude unknown and overlapping imprecise dates', () => {
  const group = cohortGroups(data).find(g => g.id === 'ena-senghor-2004')!;
  const base = group.members[0].relations[0];
  const dates = [undefined, { value: '2004-00-00', precision: 9 }, { value: '2005-00-00', precision: 9 }];
  const relations = dates.map((start, i) => ({ ...base, id: `r${i}`, start, pointInTime: undefined, cohort: undefined }));
  expect(laterPassages({ ...data, relations }, base.source, group).map(r => r.id)).toEqual(['r2']);
});
test('crossings retain each pair and never infer a meeting from an institution', () => {
  const base = data.relations.find(r => r.cohort?.id === 'ena-senghor-2004')!;
  const right = { ...base, id: 'right', source: 'other', cohort: undefined, pointInTime: undefined };
  const pairs = crossingPairs([{ entity: data.entities.find(e => e.id === base.target)!, left: [base], right: [right] }]);
  expect(pairs[0].status).toBe('unknown');
  expect(pairs[0].sameCohort).toBe(false);
});
test('guided cohort, step and crossing comparison survive reload and sharing', () => {
  const view = parseView('?graphView=system&systemLens=guided&journey=ena-senghor-2004&journeyStep=2', data);
  expect(parseView(serializeView(view), data)).toMatchObject({ systemLens: 'guided', journey: 'ena-senghor-2004', journeyStep: 2 });
  expect(parseView('?root=Q3052772&compare=Q1457778&comparisonMode=crossings', data).comparisonMode).toBe('crossings');
  expect(parseView('?journey=missing&journeyStep=999', data).journey).toBeUndefined();
});
