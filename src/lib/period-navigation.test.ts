import { describe, expect, it } from 'vitest';
import { focusView, getVisibleGraph, parseView, serializeView } from './graph';
import { loadDataset } from './dataset';
import type { ViewState } from './types';

const data = loadDataset();
const macron = parseView('?root=Q3052772', data);
const attali: ViewState = { ...macron, focus: 'Q2986712', selected: 'Q2986712', expanded: ['Q3052772', 'Q2986712'], period: 'attali-2007-Q3052772', temporal: 'same' };

describe('institution exploration in time', () => {
  it('automatically follows a dated participation when pivoting from the person into an institution', () => {
    const next = focusView(macron, 'Q2986712', data);
    expect(next.period).toBe('attali-2007-Q3052772');
    expect(next.temporal).toBe('same');
    expect(next.root).toBe('Q3052772');
  });
  it('shows the selected composition and hides other periods and undated statements', () => {
    const graph = getVisibleGraph(data, { ...attali, period: 'attali-2010-Q3052772' });
    expect(graph.entities.map(entity => entity.id).sort()).toEqual(['Q2986712', 'Q3052772', 'Q364315', 'Q74191', 'Q929763'].sort());
    expect(graph.relations.length).toBe(4);
    expect(graph.relations.every(relation => relation.cohort?.id === 'attali-2010')).toBe(true);
  });
  it('keeps unknown dates accessible in the all-periods view', () => {
    const graph = getVisibleGraph(data, { ...attali, temporal: 'all' });
    expect(graph.entities.some(entity => entity.id === 'Q438185')).toBe(true);
    expect(graph.relations.some(relation => relation.id === 'Q3052772$a1ddff27-4353-2690-ff49-9ae4159caed2')).toBe(true);
  });
  it('continues through a person in the same temporal context and resets at the starting point', () => {
    const next = focusView(attali, 'Q74191', data);
    expect(next.period).toBe(attali.period);
    expect(next.temporal).toBe('same');
    expect(focusView(next, 'Q3052772', data).temporal).toBe('all');
  });
  it('does not invent a reference period for an undated office', () => {
    const bernard = parseView('?root=Q560890', data);
    const next = focusView(bernard, 'Q16886136', data);
    expect(next.temporal).toBe('all');
    expect(next.period).toBeNull();
  });
  it('restores legacy institution URLs and honors an explicit all-periods choice', () => {
    expect(parseView('?root=Q3052772&focus=Q2986712&expanded=Q3052772,Q2986712', data).period).toBe('attali-2007-Q3052772');
    const all = { ...attali, temporal: 'all' as const };
    expect(parseView(serializeView(all), data)).toEqual(all);
    expect(parseView(serializeView(attali), data)).toEqual(attali);
  });
  it('discards unknown period references and cannot activate an undated anchor', () => {
    expect(parseView('?root=Q3052772&time=same&period=unknown', data).temporal).toBe('all');
    expect(parseView('?root=Q3052772&time=same&period=Q3052772%24a1ddff27-4353-2690-ff49-9ae4159caed2', data).period).toBeNull();
  });
});
