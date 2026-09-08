import { describe, expect, it } from 'vitest';
import { crossPartyCircles, personMilieus } from './network-insights';
import type { Entity, GraphData, Relation } from './types';

const entity = (id: string, type: Entity['type']): Entity => ({ id, label: id, type, description: '', inCorpus: type === 'person', modified: '' });
const relation = (id: string, source: string, target: string, category: Relation['category'] = 'membership', start = '2000-01-01', end = '2010-12-31'): Relation => ({ id, source, target, category, property: category === 'party' ? 'P102' : 'P463', label: 'Passage', statementUrl: `https://example.org/${id}`, references: [], start: { value: start, precision: 11 }, end: { value: end, precision: 11 } });
const entities = [entity('a', 'person'), entity('b', 'person'), entity('circle', 'organization'), entity('party-a', 'party'), entity('party-b', 'party'), entity('Q327591', 'party'), entity('generic', 'office')];
const data = (relations: Relation[], extra: Entity[] = []): GraphData => ({ entities: [...entities, ...extra], relations, meta: { version: 1, fetchedAt: '', source: '', license: '', peopleCount: 2, entityCount: entities.length, relationCount: relations.length, properties: [], description: '' } });
const base = [relation('ac', 'a', 'circle'), relation('bc', 'b', 'circle'), relation('ap', 'a', 'party-a', 'party'), relation('bp', 'b', 'party-b', 'party')];

describe('cercles entre partis', () => {
  it('retains two people and both passage and affiliation proofs for a contemporary crossing', () => {
    const circles = crossPartyCircles(data(base), base);
    expect(circles).toHaveLength(1);
    expect(circles[0].people.map(p => p.person.id)).toEqual(['a', 'b']);
    expect(circles[0].pairs[0].contemporary).toBe(true);
    expect(circles[0].pairs[0].proofs.map(r => r.id).sort()).toEqual(['ac', 'ap', 'bc', 'bp']);
  });
  it('does not manufacture a crossing from one person changing parties or from independent status', () => {
    expect(crossPartyCircles(data([base[0], base[2], relation('other', 'a', 'party-b', 'party')]), [base[0]])).toEqual([]);
    const onlyOneParty = [base[0], base[1], base[2], relation('bp', 'b', 'party-a', 'party'), relation('ind', 'b', 'Q327591', 'party')];
    expect(crossPartyCircles(data(onlyOneParty), onlyOneParty)).toEqual([]);
  });
  it('keeps historical affiliations separate from simultaneous party membership and passage', () => {
    const historical = [...base.slice(0, 3), relation('bp', 'b', 'party-b', 'party', '2020-01-01', '2023-01-01')];
    expect(crossPartyCircles(data(historical), historical)[0].pairs[0].contemporary).toBe(false);
    expect(crossPartyCircles(data(historical), historical, true)).toEqual([]);
    const openEnded = base.map(r => r.id === 'bp' ? { ...r, end: undefined } : r);
    expect(crossPartyCircles(data(openEnded), openEnded, true)).toEqual([]);
  });
  it('respects filtered passages, rejects generic offices and parliamentary-group substitutions', () => {
    expect(crossPartyCircles(data(base), [base[0]])).toEqual([]);
    const offices = base.map(r => r.target === 'circle' ? { ...r, target: 'generic' } : r);
    expect(crossPartyCircles(data(offices), offices)).toEqual([]);
    const group = base.map(r => r.id === 'bp' ? { ...r, property: 'AN:mandate' } : r);
    expect(crossPartyCircles(data(group), group)).toEqual([]);
  });
  it('does not multiply people or pairs when additional sources attest the same passage', () => {
    const repeated = [...base, { ...base[0], id: 'ac-second-source' }];
    const circle = crossPartyCircles(data(repeated), repeated)[0];
    expect(circle.people).toHaveLength(2);
    expect(circle.pairs).toHaveLength(1);
    expect(circle.people[0].passages).toHaveLength(2);
  });
  it('requires one common period across all four facts, not two unrelated pairwise overlaps', () => {
    const staggered = [relation('ac', 'a', 'circle', 'membership', '2000-01-01', '2005-01-01'), relation('bc', 'b', 'circle', 'membership', '2004-01-01', '2010-01-01'), relation('ap', 'a', 'party-a', 'party', '1999-01-01', '2003-01-01'), relation('bp', 'b', 'party-b', 'party', '2006-01-01', '2010-01-01')];
    expect(crossPartyCircles(data(staggered), staggered, true)).toEqual([]);
  });
  it('recognizes a sourced annual cohort only when both party memberships cover its entire year', () => {
    const cohort = base.slice(0, 2).map(r => ({ ...r, start: undefined, end: undefined, pointInTime: { value: '2006-00-00', precision: 9 }, cohort: { id: 'promotion-2006', label: 'Promotion 2006' }, evidence: { kind: 'official' as const, title: 'Composition', locator: 'Liste', note: '', checkedAt: '2026-09-08' } }));
    const rs = [...cohort, ...base.slice(2)];
    expect(crossPartyCircles(data(rs), rs, true)).toHaveLength(1);
    const uncertain = [...cohort, base[2], relation('bp', 'b', 'party-b', 'party', '2006-06-01', '2010-01-01')];
    expect(crossPartyCircles(data(uncertain), uncertain, true)).toEqual([]);
  });
});

describe('parcours entre milieux', () => {
  it('counts distinct classified milieus, preserves all evidence, and leaves unknown organizations unclassified', () => {
    const rs = [base[2], relation('igf', 'a', 'Q3151643', 'employment'), relation('bank', 'a', 'Q3022385', 'employment'), relation('bank2', 'a', 'Q3022385', 'employment'), relation('unknown', 'a', 'unknown', 'employment')];
    const corpus = data(rs, [entity('Q3151643', 'organization'), entity('Q3022385', 'organization'), entity('unknown', 'organization')]);
    const profile = personMilieus(corpus, rs).find(p => p.person.id === 'a')!;
    expect(profile.milieus.map(m => m.id).sort()).toEqual(['administration', 'business', 'politics']);
    expect(profile.milieus.find(m => m.id === 'business')!.passages[0].statements).toHaveLength(2);
    expect(profile.unclassified).toBe(1);
    expect(personMilieus(corpus, [rs[1]])[0].milieus).toHaveLength(1);
  });
  it('uses a sourced institutional context for a role, without classifying a generic presidency', () => {
    const role = { ...entity('president-media', 'office'), contexts: [{ property: 'P2389', id: 'Q12461', label: 'Le Monde', revision: 1 }] };
    const rs = [relation('job', 'a', role.id, 'office'), relation('generic-job', 'a', 'generic', 'office')];
    const profile = personMilieus(data(rs, [role]), rs)[0];
    expect(profile.milieus.map(m => m.id)).toEqual(['media']);
    expect(profile.unclassified).toBe(1);
  });
});
