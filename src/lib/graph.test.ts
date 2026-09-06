import { describe, expect, it } from 'vitest';
import { focusView, getCommonConnections, getVisibleGraph, parseView, searchEntities, serializeView } from './graph';
import { CATEGORIES, type GraphData, type Relation, type ViewState } from './types';

const entities = [
  ['Q1', 'Émilie Exemple', 'person'], ['Q2', 'Paul Test', 'person'],
  ['Q3', 'École commune', 'school'], ['Q4', 'Parti exemple', 'party'],
  ['Q5', 'Autre école', 'school'],
].map(([id, label, type]) => ({ id, label, type, description: '', inCorpus: type === 'person', wikidataUrl: `https://www.wikidata.org/wiki/${id}`, revision: 1, modified: '2026-09-06' })) as GraphData['entities'];
const relations = [
  ['r1', 'Q1', 'Q3', 'education'], ['r2', 'Q2', 'Q3', 'education'],
  ['r3', 'Q1', 'Q4', 'party'], ['r4', 'Q2', 'Q5', 'education'],
].map(([id, source, target, category]) => ({ id, source, target, category, property: 'P69', label: 'A étudié à', statementUrl: 'https://www.wikidata.org/', revisionUrl: 'https://www.wikidata.org/', references: [] })) as Relation[];
const data = { entities, relations, meta: { version: 1, fetchedAt: '2026-09-06', source: 'fixture', license: 'CC0-1.0', peopleCount: 2, entityCount: 5, relationCount: 4, properties: ['P69'], description: '' } } satisfies GraphData;
const state: ViewState = { root: 'Q1', focus: 'Q1', expanded: ['Q1'], categories: [...CATEGORIES], selected: 'Q1', compare: null, edge: null, mode: 'graph', temporal: 'all', period: null };

describe('entity search', () => {
  it('finds names without accents or matching case', () => expect(searchEntities(data, ' EMILIE ').map(e => e.id)).toEqual(['Q1']));
  it('restricts comparison search to people', () => expect(searchEntities(data, 'école', true)).toEqual([]));
  it('returns an empty result for an absent name', () => expect(searchEntities(data, 'introuvable')).toEqual([]));
});

describe('progressive exploration', () => {
  it('opens the new center’s neighbors and retains the link to the previous center', () => {
    expect(getVisibleGraph(data, state).entities.map(e => e.id).sort()).toEqual(['Q1', 'Q3', 'Q4']);
    const graph = getVisibleGraph(data, { ...state, focus: 'Q3', expanded: ['Q1', 'Q3'] });
    expect(graph.entities.map(e => e.id).sort()).toEqual(['Q1', 'Q2', 'Q3']);
    expect(graph.relations.map(e => e.id).sort()).toEqual(['r1', 'r2']);
  });
  it('preserves the traversed chain after another pivot without reopening old branches', () => {
    const graph = getVisibleGraph(data, { ...state, focus: 'Q2', expanded: ['Q1', 'Q3', 'Q2'] });
    expect(graph.entities.map(e => e.id).sort()).toEqual(['Q1', 'Q2', 'Q3', 'Q5']);
    expect(graph.relations.map(e => e.id).sort()).toEqual(['r1', 'r2', 'r4']);
  });
  it('changes center while keeping the starting point and permits returning along the trail', () => {
    const school = focusView(state, 'Q3');
    expect(school.root).toBe('Q1');
    expect(school.focus).toBe('Q3');
    expect(school.expanded).toEqual(['Q1', 'Q3']);
    const next = focusView(school, 'Q2');
    const back = focusView(next, 'Q3');
    expect(back.focus).toBe('Q3');
    expect(back.selected).toBe('Q3');
    expect(back.expanded).toEqual(['Q1', 'Q3']);
  });
  it('removes filtered edges and unrelated nodes', () => {
    const graph = getVisibleGraph(data, { ...state, categories: ['party'] });
    expect(graph.relations.map(e => e.id)).toEqual(['r3']);
    expect(graph.entities.map(e => e.id).sort()).toEqual(['Q1', 'Q4']);
  });
  it('retains the root with zero relationships when every category is disabled', () => {
    expect(getVisibleGraph(data, { ...state, categories: [] }).entities.map(e => e.id)).toEqual(['Q1']);
    expect(getVisibleGraph(data, { ...state, categories: [] }).relations).toEqual([]);
  });
});

describe('common connections', () => {
  it('returns each side’s actual evidence for a common entity', () => {
    const common = getCommonConnections(data, 'Q1', 'Q2', [...CATEGORIES]);
    expect(common.map(connection => connection.entity.id)).toEqual(['Q3']);
    expect(common[0].left.map(e => e.id)).toEqual(['r1']);
    expect(common[0].right.map(e => e.id)).toEqual(['r2']);
  });
  it('does not invent a common connection under a filter or for the same person', () => {
    expect(getCommonConnections(data, 'Q1', 'Q2', ['party'])).toEqual([]);
    expect(getCommonConnections(data, 'Q1', 'Q1', [...CATEGORIES])).toEqual([]);
  });
});

describe('shareable views', () => {
  it('restores selection, expansion, category filters, comparison, list mode and edge', () => {
    const view: ViewState = { ...state, focus: 'Q3', expanded: ['Q1', 'Q3'], selected: 'Q3', compare: 'Q2', categories: ['education'], mode: 'list', edge: 'r1' };
    expect(parseView(serializeView(view), data)).toEqual(view);
  });
  it('preserves an explicitly empty category filter', () => expect(parseView('?root=Q1&categories=', data).categories).toEqual([]));
  it('restores the latest expanded node as center for an old shared URL', () => {
    expect(parseView('?root=Q1&expanded=Q1,Q3&selected=Q3', data).focus).toBe('Q3');
  });
  it('rejects an unknown center and retains an explicit center independently of selection', () => {
    expect(parseView('?root=Q1&focus=missing', data).focus).toBe('Q1');
    expect(parseView('?root=Q1&focus=Q3&selected=Q1', data).focus).toBe('Q3');
  });
  it('rejects unknown entity, category, comparison and relation parameters', () => {
    const view = parseView('?root=missing&expanded=missing,Q3&selected=missing&categories=bad&compare=Q3&edge=bad', data);
    expect(view.root).toBe('Q1');
    expect(view.expanded).toEqual(['Q1', 'Q3']);
    expect(view.selected).toBe('Q1');
    expect(view.categories).toEqual([...CATEGORIES]);
    expect(view.compare).toBeNull();
    expect(view.edge).toBeNull();
  });
});
