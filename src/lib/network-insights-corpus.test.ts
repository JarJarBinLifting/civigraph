import { expect, test } from 'vitest';
import { loadDataset } from './dataset';
import { crossPartyCircles, MILIEUS, personMilieus } from './network-insights';
import { parseView, serializeView } from './graph';
import { comparePeriods } from './temporal';
import catalog from '../data/institution-milieus.json';

test('new readings and timing survive a shared URL and reject unknown timing', () => {
  const data = loadDataset();
  for (const systemLens of ['circles', 'milieus'] as const) {
    const view = { ...parseView('', data), systemLens, circleTiming: 'contemporary' as const, institution: 'Q3075672' };
    expect(parseView(serializeView(view), data)).toMatchObject({ systemLens, circleTiming: 'contemporary', institution: 'Q3075672' });
  }
  expect(parseView('?circleTiming=guess', data).circleTiming).toBeUndefined();
});

test('Young Leaders cohorts remain distinct and evidence is attached to the actual programme', () => {
  const data = loadDataset(), get = (year: number, id: string) => data.relations.find(r => r.id === `faf-young-leaders-${year}-${id}`)!;
  const macron = get(2012, 'Q3052772'), pellerin = get(2012, 'Q268660'), philippe = get(2011, 'Q3579995');
  expect(macron).toMatchObject({ category: 'membership', target: 'Q3075672', pointInTime: { value: '2012-00-00', precision: 9 }, evidence: { checkedAt: '2026-09-08' } });
  expect(comparePeriods(macron, pellerin)).toBe('documented');
  expect(comparePeriods(macron, philippe)).toBe('outside');
  expect(data.relations.filter(r => r.id.startsWith('faf-young-leaders-'))).toHaveLength(10);
});

test('the classification references real corpus entities and exposes cross-party circles and mixed careers', () => {
  const data = loadDataset(), ids = new Set(data.entities.map(e => e.id));
  expect(new Set(catalog.entries.map(e => e.id)).size).toBe(catalog.entries.length);
  for (const entry of catalog.entries) { expect(ids.has(entry.id), entry.label).toBe(true); expect(MILIEUS.some(m => m.id === entry.milieu)).toBe(true); }
  const circles = crossPartyCircles(data, data.relations);
  expect(circles.some(c => c.entity.id === 'Q3075672')).toBe(true);
  const profile = personMilieus(data, data.relations).find(p => p.person.id === 'Q3052772')!;
  expect(profile.milieus.map(m => m.id)).toEqual(expect.arrayContaining(['politics', 'education', 'business', 'circles']));
});
