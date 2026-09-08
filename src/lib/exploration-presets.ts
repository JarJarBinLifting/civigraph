import { getGraphIndex } from './graph-index';
import { shortLabel } from './presentation';
import { CATEGORIES, type GraphData, type ViewState } from './types';

export type ExplorationPreset = NonNullable<ViewState['preset']>;
export const INSTITUTION_TYPES = ['school', 'organization', 'party'] as const;

export function validPreset(data: GraphData, view: ViewState, requested: string | null | undefined): ExplorationPreset | undefined {
  const entities = getGraphIndex(data).entities;
  const root = entities.get(view.root);
  if (!root || view.graphView !== 'centered' || view.focus !== view.root || view.expanded.length !== 1) return;
  if (requested === 'comparison') return root.type === 'person' && view.compare !== root.id && entities.get(view.compare ?? '')?.type === 'person' ? requested : undefined;
  if (view.compare) return;
  if (requested === 'person' && root.type === 'person') return requested;
  if (requested === 'institution' && INSTITUTION_TYPES.some(type => type === root.type)) return requested;
}

export function createPresetView(data: GraphData, preset: ExplorationPreset, root: string, compare: string | null = null): ViewState | null {
  const view: ViewState = {
    preset, root, focus: root, expanded: [root], selected: root,
    compare: preset === 'comparison' ? compare : null,
    categories: [...CATEGORIES], mode: 'graph', graphView: 'centered',
    edge: null, temporal: 'all', period: null, year: null,
  };
  return validPreset(data, view, preset) ? view : null;
}

export function presetQuestion(data: GraphData, view: ViewState): string | null {
  const preset = validPreset(data, view, view.preset);
  if (!preset) return null;
  const entities = getGraphIndex(data).entities;
  const name = shortLabel(entities.get(view.root)!);
  if (preset === 'comparison') return `Que partagent ${name} et ${shortLabel(entities.get(view.compare!)!)} ?`;
  if (preset === 'institution') return `${name} : qui y est passé ?`;
  return `${name} : quel est son parcours ?`;
}

export function presetExamples(data: GraphData): ViewState[] {
  return [
    createPresetView(data, 'person', 'Q3052772'),
    createPresetView(data, 'institution', 'Q273579'),
    createPresetView(data, 'comparison', 'Q3052772', 'Q364315'),
  ].filter((view): view is ViewState => view !== null);
}
