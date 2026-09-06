import { expect, it } from 'vitest';
import { formatDate, periodLabel } from './presentation';
import type { Relation } from './types';

it('does not invent a day or month for year-precision dates', () => {
  expect(formatDate({ value: '2008-01-01', precision: 9 })).toBe('2008');
  expect(formatDate({ value: '2002-00-00', precision: 9 })).toBe('2002');
});
it('does not interpret a missing end date as an ongoing role', () => {
  expect(periodLabel({ start: { value: '2017-05-14', precision: 11 } } as Relation)).toBe('Début : 14 mai 2017 · fin non renseignée');
  expect(periodLabel({} as Relation)).toBe('Période non renseignée');
});
