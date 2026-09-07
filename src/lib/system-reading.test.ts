import { describe, expect, it } from 'vitest';
import { CATEGORIES, type Entity, type GraphData, type Relation } from './types';
import { parseView, serializeView } from './graph';
import { getSystemGraph } from './system-graph';
import { categoriesForSystem, politicalAffiliations, organizeSystem, sharedPassageFacts } from './system-reading';

const entity = (id: string, type: Entity['type']): Entity => ({ id, type, label: id, description: '', modified: '', inCorpus: true });
const relation = (id: string, source: string, target: string, category: Relation['category'], from?: string, to?: string): Relation => ({ id, source, target, category, property: 'fixture', label: category, statementUrl: `https://example.org/${id}`, references: [], ...(from ? { start: { value: `${from}-01-01`, precision: 11 } } : {}), ...(to ? { end: { value: `${to}-12-31`, precision: 11 } } : {}) });
const relations = [relation('as', 'a', 'school', 'education', '2000', '2004'), relation('bs', 'b', 'school', 'education', '2002', '2005'), relation('at', 'a', 'university', 'education'), relation('ap', 'a', 'party', 'party', '2010', '2012'), relation('ap2', 'a', 'party', 'party'), relation('aq', 'other-party', 'a', 'party', '2018'), relation('bq', 'b', 'other-party', 'party')];
const data: GraphData = { entities: [entity('a', 'person'), entity('b', 'person'), entity('unknown', 'person'), entity('school', 'school'), entity('university', 'school'), entity('party', 'party'), entity('other-party', 'party')], relations, meta: { version: 1, fetchedAt: '', source: '', license: '', description: '', properties: [], peopleCount: 3, entityCount: 7, relationCount: 7 } };

describe('whole network organized by sourced systems', () => {
  it('retains every formation connection, including multiple schools per person, and honors explicit filters', () => {
    const graph = getSystemGraph(data, { categories: categoriesForSystem('education', [...CATEGORIES]), temporal: 'all', period: null, selected: '' });
    expect(graph.relations.map(r => r.id)).toEqual(['as', 'bs', 'at']);
    expect(graph.entities.map(e => e.id)).toEqual(['a', 'b', 'school', 'university']);
    expect(categoriesForSystem('education', ['party'])).toEqual([]);
    expect(categoriesForSystem('all', [...CATEGORIES])).toEqual([...CATEGORIES]);
  });
  it('preserves each political statement and multiple historical affiliations, independently of education filters', () => {
    const politics = politicalAffiliations(data);
    expect(politics.people.get('a')!.map(a => [a.party.id, a.statements.map(r => r.id)])).toEqual([['other-party', ['aq']], ['party', ['ap', 'ap2']]]);
    expect(politics.people.get('unknown')).toEqual([]);
    expect(politics.people.get('a')![0].statements[0].end).toBeUndefined();
    expect(politics.parties.find(p => p.entity.id === 'party')!.people).toBe(1);
    expect(politics.parties.find(p => p.entity.id === 'other-party')!.people).toBe(2);
  });
  it('keeps all nodes and uses every institutional anchor, without assigning a person to one exclusive group', () => {
    const graph = getSystemGraph(data, { categories: ['education'], temporal: 'all', period: null, selected: '' });
    const positions = organizeSystem(graph);
    expect(Object.keys(positions).sort()).toEqual(['a', 'b', 'school', 'university']);
    for (const p of Object.values(positions)) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    const changed = organizeSystem(getSystemGraph({ ...data, relations: relations.filter(r => r.id !== 'at') }, { categories: ['education'], temporal: 'all', period: null, selected: '' }));
    expect(positions.a).not.toEqual(changed.a);
    expect(organizeSystem({ ...graph, entities: [...graph.entities].reverse(), relations: [...graph.relations].reverse() })).toEqual(positions);
  });
  it('restores the chosen organization and reading with the complementary tools in a URL', () => {
    const state = { ...parseView('?graphView=system', data), system: 'education' as const, reading: 'individuals' as const, systemLens: 'common' as const, group: ['a', 'b'], commonDisplay: 'matrix' as const };
    expect(parseView(serializeView(state), data)).toEqual(state);
    expect(parseView('?system=imagined&reading=imagined', data).system).toBeUndefined();
    expect(parseView('?system=imagined&reading=imagined', data).reading).toBeUndefined();
  });
});

describe('passage evidence does not imply meetings or an undocumented cohort', () => {
  it('distinguishes a shared institution and dated overlap from a documented school cohort', () => {
    expect(sharedPassageFacts([relations[0]], [relations[1]])).toEqual({ sameInstitution: true, overlap: 1, promotions: [] });
    const official = { kind: 'official' as const, title: 'Promotion', locator: 'p. 1', note: '', checkedAt: '' };
    const cohort = { id: 'cohort-2004', label: 'Promotion 2004' };
    const a = { ...relations[0], cohort, evidence: official }, b = { ...relations[1], cohort, evidence: official };
    expect(sharedPassageFacts([a], [b]).promotions).toEqual(['Promotion 2004']);
    expect(sharedPassageFacts([a], [{ ...b, target: 'university' }]).promotions).toEqual([]);
    expect(sharedPassageFacts([{ ...a, category: 'membership' }], [{ ...b, category: 'membership' }]).promotions).toEqual([]);
    expect(sharedPassageFacts([relations[0]], [{ ...relations[1], start: undefined, end: undefined }]).overlap).toBe(0);
  });
});
