import { describe, expect, it } from 'vitest';
import { comparePeriods } from './temporal';
import type { Relation, SourceDate } from './types';

const date = (value: string, precision = 11): SourceDate => ({ value, precision });
const relation = (dates: Partial<Relation>): Relation => ({ id: 'test', source: 'person', target: 'institution', category: 'membership', property: 'P463', label: 'Membre', statementUrl: 'https://example.com/source', references: [], ...dates });
const span = (start: string, end: string, precision = 11) => relation({ start: date(start, precision), end: date(end, precision) });

describe('documented shared periods', () => {
  it('accepts actual intersections and rejects disjoint exact intervals', () => {
    const anchor = span('2007-08-28', '2008-01-23');
    expect(comparePeriods(anchor, span('2008-01-01', '2009-02-01'))).toBe('documented');
    expect(comparePeriods(anchor, span('2008-02-01', '2009-02-01'))).toBe('outside');
    expect(comparePeriods(anchor, span('2008-01-23', '2008-01-23'))).toBe('documented');
  });
  it('does not turn a shared boundary year into proven overlap', () => {
    expect(comparePeriods(span('2007-00-00', '2008-00-00', 9), span('2008-00-00', '2010-00-00', 9))).toBe('possible');
    expect(comparePeriods(span('2007-00-00', '2012-00-00', 9), span('2009-00-00', '2011-00-00', 9))).toBe('documented');
  });
  it('preserves month precision instead of fabricating the first day', () => {
    expect(comparePeriods(span('2010-01-00', '2010-03-00', 10), span('2010-03-20', '2010-04-10'))).toBe('possible');
    expect(comparePeriods(span('2010-01-00', '2010-03-00', 10), span('2010-02-01', '2010-02-28'))).toBe('documented');
  });
  it('requires enough evidence for point dates and distinguishes an uncertain year', () => {
    expect(comparePeriods(relation({ pointInTime: date('2010-06-15') }), span('2010-01-01', '2010-12-31'))).toBe('documented');
    expect(comparePeriods(relation({ pointInTime: date('2010-00-00', 9) }), span('2010-06-01', '2010-06-30'))).toBe('possible');
    expect(comparePeriods(relation({ pointInTime: date('2010-00-00', 9) }), span('2009-01-01', '2011-12-31'))).toBe('documented');
  });
  it('never interprets an absent end as an ongoing participation', () => {
    expect(comparePeriods(span('2007-08-28', '2008-01-23'), relation({ start: date('2007-08-28') }))).toBe('unknown');
    expect(comparePeriods(span('2007-08-28', '2008-01-23'), relation({}))).toBe('unknown');
  });
  it('rejects invalid and reversed dates', () => {
    expect(comparePeriods(span('2010-02-30', '2011-01-01'), span('2010-01-01', '2011-01-01'))).toBe('unknown');
    expect(comparePeriods(span('2012-01-01', '2010-01-01'), span('2010-01-01', '2011-01-01'))).toBe('unknown');
  });
  it('recognizes a shared sourced composition without inventing individual start/end dates', () => {
    const evidence = { kind: 'official' as const, title: 'Composition 2010', locator: 'Annexe', note: '', checkedAt: '2026-09-06' };
    const cohort = { id: 'commission-2010', label: 'Mission 2010' };
    const a = relation({ evidence, cohort, pointInTime: date('2010-00-00', 9) });
    expect(comparePeriods(a, relation({ ...a, source: 'second' }))).toBe('documented');
    expect(comparePeriods(a, relation({ ...a, target: 'other-institution' }))).toBe('possible');
    expect(comparePeriods(a, relation({ ...a, evidence: undefined }))).toBe('possible');
  });
});
