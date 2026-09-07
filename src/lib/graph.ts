import { CATEGORIES, type Category, type CommonConnection, type GraphData, type Relation, type ViewState } from './types';
import { comparePeriods, periodBounds, supportsPeriods } from './temporal';
import { getGraphIndex, normalizeName, orderedEntities } from './graph-index';
import { sortRelationsChronologically } from './chronology';

export function focusView(state: ViewState, id: string, data?: GraphData): ViewState {
  const trail = [...new Set([state.root, ...state.expanded])];
  const previousStep = trail.indexOf(id);
  const next: ViewState = { ...state, focus: id, selected: id, expanded: previousStep >= 0 ? trail.slice(0, previousStep + 1) : [...trail, id], edge: null, compare: null };
  if (id === state.root) return { ...next, period: null, temporal: 'all' };
  if (data && supportsPeriods(getGraphIndex(data).entities.get(id)!)) {
    const context = getPeriodContext(data, next);
    const period = context.options.find(option => option.id === state.period) ?? context.options.find(option => context.anchor && comparePeriods(option, context.anchor) === 'documented') ?? context.options.find(option => option.cohort) ?? context.options[0];
    if (period) return { ...next, period: period.id, temporal: 'same' };
  }
  return next;
}

export function careerView(state: ViewState, id: string, data: GraphData): ViewState {
  return { ...focusView(state, id, data), temporal: 'all', period: null };
}

export function getUncertainConnections(data: GraphData, state: ViewState) {
  const index = getGraphIndex(data);
  const anchor = index.relations.get(state.period ?? '');
  const focus = index.entities.get(state.focus);
  if (state.temporal !== 'same' || state.compare || !anchor || !focus || !supportsPeriods(focus)) return [];
  const relations = (index.incoming.get(focus.id) ?? []).filter(relation => state.categories.includes(relation.category));
  const known = new Set(relations.filter(relation => matchesPeriod(relation, anchor, 'same')).map(relation => relation.source));
  const groups = new Map<string, Relation[]>();
  for (const relation of relations) {
    if (known.has(relation.source)) continue;
    const overlap = comparePeriods(relation, anchor);
    if (overlap === 'unknown' || overlap === 'possible') groups.set(relation.source, [...(groups.get(relation.source) ?? []), relation]);
  }
  return data.entities.filter(entity => entity.type === 'person' && groups.has(entity.id))
    .map(entity => ({ entity, relations: sortRelationsChronologically(groups.get(entity.id)!) }))
    .sort((a, b) => a.entity.label.localeCompare(b.entity.label, 'fr'));
}

export function getPeriodContext(data: GraphData, state: Pick<ViewState, 'root' | 'focus' | 'expanded' | 'period' | 'categories'>) {
  const graphIndex = getGraphIndex(data);
  const requestedAnchor = graphIndex.relations.get(state.period ?? '');
  const anchor = requestedAnchor && periodBounds(requestedAnchor) ? requestedAnchor : undefined;
  const focused = graphIndex.entities.get(state.focus)!;
  const institution = supportsPeriods(focused) ? focused : graphIndex.entities.get(anchor?.target ?? '');
  if (!institution) return { institution: undefined, reference: undefined, anchor, options: [] as Relation[] };
  const index = state.expanded.indexOf(institution.id);
  const preceding = index < 0 ? state.expanded : state.expanded.slice(0, index);
  const incoming = graphIndex.incoming.get(institution.id) ?? [];
  const reference = [...preceding].reverse().map(id => graphIndex.entities.get(id)!).find(entity => entity.type === 'person' && incoming.some(relation => relation.source === entity.id));
  const candidates = incoming.filter(relation => (!reference || relation.source === reference.id) && periodBounds(relation));
  const unique = new Map<string, Relation>();
  for (const relation of candidates) {
    const key = relation.cohort?.id ?? JSON.stringify([relation.start, relation.end, relation.pointInTime]);
    if (!unique.has(key)) unique.set(key, relation);
  }
  const options = [...unique.values()].sort((a, b) => periodBounds(a)!.first - periodBounds(b)!.first || a.id.localeCompare(b.id));
  return { institution, reference, anchor, options };
}

export function matchesPeriod(relation: Relation, anchor: Relation | undefined, mode: ViewState['temporal'] = 'all') {
  return mode === 'all' || Boolean(anchor && (relation.id === anchor.id || comparePeriods(relation, anchor) === 'documented'));
}

export function searchEntities(data: GraphData, query: string, peopleOnly = false): GraphData['entities'] {
  const term = normalizeName(query);
  return getGraphIndex(data).search
    .filter(({ entity, names }) => (!peopleOnly || (entity.type === 'person' && entity.inCorpus)) && (!term || names.some(name => name.includes(term)) || entity.id.toLowerCase() === term))
    .map(({ entity, names }) => ({ entity, exact: Number(names.includes(term)), prefix: Number(names.some(name => name.startsWith(term))) }))
    .sort((a, b) => b.exact - a.exact || b.prefix - a.prefix || Number(b.entity.inCorpus) - Number(a.entity.inCorpus) || a.entity.label.localeCompare(b.entity.label, 'fr'))
    .map(({ entity }) => entity);
}

export function getVisibleGraph(data: GraphData, state: Pick<ViewState, 'root' | 'focus' | 'expanded' | 'categories' | 'compare'> & Partial<Pick<ViewState, 'period' | 'temporal'>>): Pick<GraphData, 'entities' | 'relations'> {
  const trail = new Set([state.root, ...state.expanded, state.focus]);
  const centers = new Set(state.compare ? [state.root, state.compare] : [state.focus]);
  const index = getGraphIndex(data);
  const anchor = index.relations.get(state.period ?? '');
  const candidates = new Map([...new Set([...trail, ...centers])].flatMap(id => index.incident.get(id) ?? []).map(relation => [relation.id, relation]));
  const relations = [...candidates.values()].filter(relation => state.categories.includes(relation.category) && matchesPeriod(relation, anchor, state.compare ? 'all' : state.temporal) && (centers.has(relation.source) || centers.has(relation.target) || (trail.has(relation.source) && trail.has(relation.target))))
    .sort((a, b) => index.relationOrder.get(a.id)! - index.relationOrder.get(b.id)!);
  const visible = new Set([...trail, ...centers]);
  for (const relation of relations) { visible.add(relation.source); visible.add(relation.target); }
  return { entities: orderedEntities(data, visible), relations };
}

export function getCommonConnections(data: GraphData, leftId: string, rightId: string, categories: Category[]): CommonConnection[] {
  if (leftId === rightId) return [];
  const index = getGraphIndex(data);
  const group = (id: string) => {
    const result = new Map<string, Relation[]>();
    for (const relation of index.outgoing.get(id) ?? []) {
      if (!categories.includes(relation.category)) continue;
      const statements = result.get(relation.target);
      if (statements) statements.push(relation); else result.set(relation.target, [relation]);
    }
    return result;
  };
  const left = group(leftId), right = group(rightId);
  return [...left.entries()].flatMap(([id, statements]) => {
    const entity = index.entities.get(id), other = right.get(id);
    return entity && other ? [{ entity, left: sortRelationsChronologically(statements), right: sortRelationsChronologically(other) }] : [];
  }).sort((a, b) => Number(b.entity.type === 'school') - Number(a.entity.type === 'school') || a.entity.label.localeCompare(b.entity.label, 'fr'));
}

export function parseView(search: string, data: GraphData): ViewState {
  const params = new URLSearchParams(search);
  const index = getGraphIndex(data);
  const ids = index.entities;
  const requestedRoot = params.get('root') ?? '';
  const root = ids.has(requestedRoot) ? requestedRoot : data.entities.find(entity => entity.id === 'Q3052772')?.id ?? data.entities[0].id;
  const requestedCategories = params.get('categories');
  const categories = requestedCategories === null ? [...CATEGORIES] : CATEGORIES.filter(category => requestedCategories.split(',').includes(category));
  const expanded = [...new Set([root, ...(params.get('expanded') ?? '').split(',').filter(id => ids.has(id))])];
  const requestedFocus = params.get('focus');
  const focus = requestedFocus === null ? expanded[expanded.length - 1] : ids.has(requestedFocus) ? requestedFocus : root;
  if (!expanded.includes(focus)) expanded.push(focus);
  const compare = params.get('compare');
  const rootIsPerson = data.entities.some(entity => entity.id === root && entity.type === 'person');
  const validComparison = rootIsPerson && compare !== root && data.entities.some(entity => entity.id === compare && entity.type === 'person' && entity.inCorpus);
  const group = [...new Set((params.get('group') ?? '').split(',').filter(id => ids.get(id)?.type === 'person'))];
  const institution = ids.get(params.get('institution') ?? '');
  const bridge = ids.get(params.get('bridge') ?? '');
  const state: ViewState = {
    root, focus, expanded,
    categories: categories.length || requestedCategories === '' ? categories : [...CATEGORIES],
    selected: ids.has(params.get('selected') ?? '') ? params.get('selected')! : root,
    compare: validComparison ? compare : null,
    ...(params.get('spotlight') === 'off' ? { spotlight: 'off' as const } : {}),
    ...(['all', ...CATEGORIES].includes(params.get('system') ?? '') ? { system: params.get('system') as ViewState['system'] } : {}),
    ...(['groups', 'individuals'].includes(params.get('reading') ?? '') ? { reading: params.get('reading') as ViewState['reading'] } : {}),
    ...(['institutions', 'entities', 'common'].includes(params.get('systemLens') ?? '') ? { systemLens: params.get('systemLens') as ViewState['systemLens'] } : {}),
    ...(group.length ? { group } : {}),
    ...(['all', 'two'].includes(params.get('commonThreshold') ?? '') ? { commonThreshold: params.get('commonThreshold') as ViewState['commonThreshold'] } : {}),
    ...(['map', 'matrix'].includes(params.get('commonDisplay') ?? '') ? { commonDisplay: params.get('commonDisplay') as ViewState['commonDisplay'] } : {}),
    ...(institution && supportsPeriods(institution) ? { institution: institution.id } : {}),
    ...(institution && supportsPeriods(institution) && bridge && bridge.id !== institution.id && supportsPeriods(bridge) ? { bridge: bridge.id } : {}),
    ...(params.get('comparisonView') === 'cards' ? { comparisonView: 'cards' as const } : {}),
    ...(validComparison && params.get('comparisonMode') === 'paths' ? { comparisonMode: 'paths' as const } : {}),
    mode: params.get('mode') === 'list' ? 'list' : 'graph',
    ...(params.get('graphView') === 'system' || (!params.has('graphView') && !['root', 'focus', 'selected', 'expanded', 'compare', 'edge'].some(key => params.has(key))) ? { graphView: 'system' as const } : params.get('graphView') === 'centered' ? { graphView: 'centered' as const } : {}),
    edge: index.relations.has(params.get('edge') ?? '') ? params.get('edge') : null,
    temporal: 'all', period: null, year: /^[1-9]\d{0,3}$/.test(params.get('year') ?? '') ? Number(params.get('year')) : null,
  };
  const requestedPeriod = params.get('period');
  const period = data.relations.find(relation => relation.id === requestedPeriod && periodBounds(relation));
  if (period) return { ...state, period: period.id, temporal: params.get('time') === 'same' && !validComparison ? 'same' : 'all' };
  if (!requestedPeriod && !validComparison && !state.graphView) {
    const context = getPeriodContext(data, state);
    const initialPeriod = context.options.find(option => option.cohort) ?? context.options[0];
    if (initialPeriod && focus !== root) return { ...state, period: initialPeriod.id, temporal: params.get('time') === 'all' ? 'all' : 'same' };
  }
  return state;
}

export function serializeView(state: ViewState): string {
  const params = new URLSearchParams({ root: state.root, focus: state.focus, expanded: [...new Set(state.expanded)].join(','), categories: CATEGORIES.filter(category => state.categories.includes(category)).join(','), selected: state.selected });
  if (state.compare) params.set('compare', state.compare);
  if (state.compare && state.comparisonView === 'cards') params.set('comparisonView', 'cards');
  if (state.compare && state.comparisonMode === 'paths') params.set('comparisonMode', 'paths');
  if (state.mode === 'list') params.set('mode', 'list');
  if (state.graphView) params.set('graphView', state.graphView);
  if (state.system) params.set('system', state.system);
  if (state.reading) params.set('reading', state.reading);
  if (state.spotlight) params.set('spotlight', state.spotlight);
  if (state.systemLens) params.set('systemLens', state.systemLens);
  if (state.group?.length) params.set('group', [...new Set(state.group)].join(','));
  if (state.commonThreshold) params.set('commonThreshold', state.commonThreshold);
  if (state.commonDisplay) params.set('commonDisplay', state.commonDisplay);
  if (state.institution) params.set('institution', state.institution);
  if (state.bridge) params.set('bridge', state.bridge);
  if (state.edge) params.set('edge', state.edge);
  params.set('time', state.temporal);
  if (state.period) params.set('period', state.period);
  if (state.year !== null) params.set('year', String(state.year));
  return `?${params}`;
}
