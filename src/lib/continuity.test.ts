import { describe, expect, it } from 'vitest';
import { careerView, getUncertainConnections, getVisibleGraph, parseView, serializeView } from './graph';
import { loadDataset } from './dataset';
import type { GraphData, Relation } from './types';

const data = loadDataset();
const base: Relation = { id: 'anchor', source: 'first', target: 'school', category: 'education', label: 'A étudié à', property: 'P69', start: { value: '2007-01-01', precision: 11 }, end: { value: '2009-06-30', precision: 11 }, statementUrl: 'https://example.org', references: [] };
const fixture: GraphData = { meta: data.meta, entities: ['first', 'undated', 'outside', 'known', 'possible', 'school'].map(id => ({ id, label: id, description: '', type: id === 'school' ? 'school' : 'person', inCorpus: id !== 'school', modified: '' })), relations: [base, { ...base, id: 'unknown', source: 'undated', start: undefined, end: undefined }, { ...base, id: 'outside', source: 'outside', start: { value: '2010-01-01', precision: 11 }, end: { value: '2012-01-01', precision: 11 } }, { ...base, id: 'known', source: 'known' }, { ...base, id: 'known-unknown', source: 'known', start: undefined, end: undefined }, { ...base, id: 'possible', source: 'possible', start: { value: '2009-00-00', precision: 9 }, end: { value: '2010-00-00', precision: 9 } }] };
const strictView = parseView('?root=first&focus=school&expanded=first,school&time=same&period=anchor', fixture);

describe('continuing exploration when dates are insufficient', () => {
  it('lists unknown people separately while keeping the strict graph factual', () => {
    expect(getVisibleGraph(fixture, strictView).relations.map(r => r.id)).not.toContain('unknown');
    expect(getUncertainConnections(fixture, strictView).map(item => item.entity.id)).toContain('undated');
    expect(getUncertainConnections(fixture, strictView).map(item => item.entity.id)).toContain('possible');
    expect(getUncertainConnections(fixture, strictView).map(item => item.entity.id)).not.toContain('outside');
    expect(getUncertainConnections(fixture, strictView).map(item => item.entity.id)).not.toContain('known');
  });
  it('respects categories, comparison and the all-periods view', () => {
    expect(getUncertainConnections(fixture, { ...strictView, categories: ['office'] })).toEqual([]);
    expect(getUncertainConnections(fixture, { ...strictView, temporal: 'all' })).toEqual([]);
    expect(getUncertainConnections(fixture, { ...strictView, compare: 'known' })).toEqual([]);
  });
  it('can leave the time context for a full career and restore that choice from its URL', () => {
    const view = careerView(strictView, 'undated', fixture);
    expect(view.focus).toBe('undated');
    expect(view.expanded).toEqual(['first', 'school', 'undated']);
    expect(view.temporal).toBe('all');
    expect(view.period).toBeNull();
    expect(parseView(serializeView(view), fixture)).toEqual(view);
  });
  it('unblocks Areva with a dated board composition and still offers undated people', () => {
    const anchor = data.relations.find(r => r.source === 'Q3579995' && r.target === 'Q455484' && r.start && r.end)!;
    const view = parseView(`?root=Q3579995&focus=Q455484&expanded=Q3579995,Q455484&time=same&period=${encodeURIComponent(anchor.id)}`, data);
    const graph = getVisibleGraph(data, view);
    expect(graph.entities.map(entity => entity.id)).toContain('Q469310');
    expect(graph.entities.map(entity => entity.id)).toContain('Q3123589');
    expect(getUncertainConnections(data, view).map(item => item.entity.id)).toContain('Q3092308');
  });
});
