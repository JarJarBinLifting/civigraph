import { describe, expect, it } from 'vitest';
import { CATEGORIES, type GraphData, type Relation } from './types';
import { parseView, serializeView } from './graph';
import { getSystemGraph, systemNeighborhood, switchGraphView } from './system-graph';

const entities = ['a', 'b', 'school', 'party', 'isolated'].map(id => ({ id, label: id, type: id === 'school' ? 'school' : id === 'party' ? 'party' : 'person', inCorpus: true, description: '', modified: '' })) as GraphData['entities'];
const make = (id: string, source: string, target: string, category: Relation['category'], dated = true): Relation => ({ id, source, target, category, property: 'P69', label: 'A étudié à', statementUrl: 'https://example.org', references: [], ...(dated ? { start: { value: '2002-00-00', precision: 9 }, end: { value: '2004-00-00', precision: 9 } } : {}) });
const relations = [make('as', 'a', 'school', 'education'), make('as2', 'a', 'school', 'education'), make('bs', 'b', 'school', 'education'), make('bp', 'b', 'party', 'party', false)];
const data = { entities, relations, meta: { version: 1, fetchedAt: '2026-09-06', source: 'fixture', license: '', description: '', properties: [], peopleCount: 3, entityCount: 5, relationCount: 4 } } satisfies GraphData;
const view = { ...parseView('?root=a', data), categories: [...CATEGORIES] };

describe('whole-system projection', () => {
  it('includes other centers and isolated corpus entities without duplicating connections or losing declarations', () => {
    const graph = getSystemGraph(data, view);
    expect(graph.entities).toHaveLength(5);
    expect(graph.relations).toEqual(relations);
    expect(graph.connections).toHaveLength(3);
    expect(graph.connections.flatMap(c => c.relations)).toEqual(['as', 'as2', 'bs', 'bp']);
    expect(systemNeighborhood(graph, 'a', 1)).toEqual(new Set(['a', 'school']));
    expect(systemNeighborhood(graph, 'a', 2)).toEqual(new Set(['a', 'school', 'b']));
  });
  it('uses the existing period semantics and category filters, with only selection retained when disconnected', () => {
    const graph = getSystemGraph(data, { ...view, categories: ['education'], temporal: 'same', period: 'as' });
    expect(graph.relations.map(r => r.id)).toEqual(['as', 'as2', 'bs']);
    expect(graph.entities.map(e => e.id)).toEqual(['a', 'b', 'school']);
    const empty = getSystemGraph(data, { ...view, categories: [] });
    expect(empty.relations).toEqual([]);
    expect(empty.entities.map(e => e.id)).toEqual(['a']);
    expect(getSystemGraph(data, { ...view, temporal: 'same', period: 'as', categories: ['party'] }).relations).toEqual([]);
  });
});

describe('system / centered continuity', () => {
  it('switches to the selected entity without resetting periods, category filters, source or reference year', () => {
    const state = { ...view, graphView: 'system' as const, selected: 'school', period: 'as', temporal: 'same' as const, year: 2003, edge: 'as2', categories: ['education' as const] };
    const centered = switchGraphView(state, 'centered');
    expect(centered).toMatchObject({ graphView: 'centered', focus: 'school', selected: 'school', period: 'as', temporal: 'same', year: 2003, edge: 'as2', categories: ['education'] });
    expect(centered.expanded).toContain('school');
    const system = switchGraphView(centered, 'system');
    expect(system).toEqual({ ...centered, graphView: 'system' });
    expect(parseView(serializeView(system), data)).toEqual(system);
  });
  it('opens free exploration as system, but keeps legacy entity URLs centered', () => {
    expect(parseView('', data).graphView).toBe('system');
    expect(parseView('?root=a', data).graphView ?? 'centered').toBe('centered');
    expect(parseView('?root=a&graphView=system', data).graphView).toBe('system');
    expect(parseView('?root=a&graphView=invalid', data).graphView ?? 'centered').toBe('centered');
  });
  it('does not invent a period when sharing an explicit all-period perspective', () => {
    const centered = switchGraphView({ ...view, selected: 'school', period: null, temporal: 'all' }, 'centered');
    expect(parseView(serializeView(centered), data)).toEqual(centered);
  });
});
