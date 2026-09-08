import { describe, expect, it } from 'vitest';
import { loadDataset } from './dataset';
import { parseView, serializeView } from './graph';
import { restoreSavedView } from './saved-views';
import { createPresetView, presetExamples, presetQuestion } from './exploration-presets';
import { getCommonConnections, getVisibleGraph } from './graph';
import { CATEGORIES } from './types';

const data = loadDataset();

describe('guided exploration links', () => {
  it('opens examples on real, nonempty views with traceable comparison results', () => {
    const examples = presetExamples(data);
    expect(examples).toHaveLength(3);
    for (const view of examples) {
      expect(getVisibleGraph(data, view).relations.length).toBeGreaterThan(0);
      expect(presetQuestion(data, view)).toBeTruthy();
      if (view.compare) expect(getCommonConnections(data, view.root, view.compare, view.categories).length).toBeGreaterThan(0);
    }
  });

  it('starts an institution with all periods and a single center', () => {
    const next = createPresetView(data, 'institution', 'Q273579')!;
    expect(next).toMatchObject({ root: 'Q273579', focus: 'Q273579', expanded: ['Q273579'], categories: [...CATEGORIES], temporal: 'all', period: null, year: null, compare: null, edge: null, mode: 'graph', graphView: 'centered' });
    expect(parseView(serializeView(next), data).preset).toBe('institution');
  });

  it('rejects missing entities and comparing a person to themself', () => {
    expect(createPresetView(data, 'person', 'missing')).toBeNull();
    expect(createPresetView(data, 'comparison', 'Q3052772', 'Q3052772')).toBeNull();
    expect(createPresetView(data, 'comparison', 'Q3052772', 'Q273579')).toBeNull();
  });
  it('keeps the guiding question when a person exploration is shared or saved', () => {
    const query = '?root=Q3052772&graphView=centered&preset=person';
    const shared = serializeView(parseView(query, data));
    expect(new URLSearchParams(shared).get('preset')).toBe('person');
    const restored = restoreSavedView({ id: 'test', name: 'Parcours', createdAt: '2026-09-08T00:00:00Z', query: shared }, data);
    expect(new URLSearchParams(serializeView(restored.view!)).get('preset')).toBe('person');
  });

  it('preserves a comparison question with both people', () => {
    const shared = serializeView(parseView('?root=Q3052772&compare=Q364315&graphView=centered&preset=comparison', data));
    expect(new URLSearchParams(shared).get('preset')).toBe('comparison');
    expect(new URLSearchParams(shared).get('compare')).toBe('Q364315');
  });

  it.each([
    '?root=Q273579&graphView=centered&preset=person',
    '?root=Q3052772&graphView=centered&preset=institution',
    '?root=Q3052772&graphView=centered&preset=comparison',
    '?root=Q3052772&graphView=system&preset=person',
    '?root=Q3052772&focus=Q273579&graphView=centered&preset=person',
    '?root=Q3052772&graphView=centered&preset=unknown',
  ])('drops a question that does not describe the shared view: %s', query => {
    expect(new URLSearchParams(serializeView(parseView(query, data))).has('preset')).toBe(false);
  });
});
