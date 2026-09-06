import { CATEGORIES, type Category, type CommonConnection, type GraphData, type Relation, type ViewState } from './types';
import { shortLabel } from './presentation';
import { comparePeriods, periodBounds, supportsPeriods } from './temporal';

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim();

export function focusView(state: ViewState, id: string, data?: GraphData): ViewState {
  const trail = [...new Set([state.root, ...state.expanded])];
  const previousStep = trail.indexOf(id);
  const next: ViewState = { ...state, focus: id, selected: id, expanded: previousStep >= 0 ? trail.slice(0, previousStep + 1) : [...trail, id], edge: null, compare: null, page: 0 };
  if (id === state.root) return { ...next, period: null, temporal: 'all' };
  if (data && supportsPeriods(data.entities.find(entity => entity.id === id)!)) {
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
  const anchor = data.relations.find(relation => relation.id === state.period);
  const focus = data.entities.find(entity => entity.id === state.focus);
  if (state.temporal !== 'same' || state.compare || !anchor || !focus || !supportsPeriods(focus)) return [];
  const relations = data.relations.filter(relation => relation.target === focus.id && state.categories.includes(relation.category));
  const known = new Set(relations.filter(relation => matchesPeriod(relation, anchor, 'same')).map(relation => relation.source));
  const groups = new Map<string, Relation[]>();
  for (const relation of relations) {
    if (known.has(relation.source)) continue;
    const overlap = comparePeriods(relation, anchor);
    if (overlap === 'unknown' || overlap === 'possible') groups.set(relation.source, [...(groups.get(relation.source) ?? []), relation]);
  }
  return data.entities.filter(entity => entity.type === 'person' && groups.has(entity.id))
    .map(entity => ({ entity, relations: groups.get(entity.id)! }))
    .sort((a, b) => a.entity.label.localeCompare(b.entity.label, 'fr'));
}

export function getPeriodContext(data: GraphData, state: Pick<ViewState, 'root' | 'focus' | 'expanded' | 'period' | 'categories'>) {
  const anchor = data.relations.find(relation => relation.id === state.period && periodBounds(relation));
  const focused = data.entities.find(entity => entity.id === state.focus)!;
  const institution = supportsPeriods(focused) ? focused : data.entities.find(entity => entity.id === anchor?.target);
  if (!institution) return { institution: undefined, reference: undefined, anchor, options: [] as Relation[] };
  const index = state.expanded.indexOf(institution.id);
  const preceding = index < 0 ? state.expanded : state.expanded.slice(0, index);
  const reference = [...preceding].reverse().map(id => data.entities.find(entity => entity.id === id)!).find(entity => entity.type === 'person' && data.relations.some(relation => relation.source === entity.id && relation.target === institution.id));
  const candidates = data.relations.filter(relation => relation.target === institution.id && (!reference || relation.source === reference.id) && periodBounds(relation));
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
  const term = normalize(query);
  const names = (entity: GraphData['entities'][number]) => [normalize(entity.label), normalize(shortLabel(entity))];
  return data.entities
    .filter(entity => (!peopleOnly || (entity.type === 'person' && entity.inCorpus)) && (!term || names(entity).some(name => name.includes(term)) || entity.id.toLowerCase() === term))
    .sort((a, b) => Number(names(b).some(name => name === term)) - Number(names(a).some(name => name === term)) || Number(names(b).some(name => name.startsWith(term))) - Number(names(a).some(name => name.startsWith(term))) || Number(b.inCorpus) - Number(a.inCorpus) || a.label.localeCompare(b.label, 'fr'));
}

export function getVisibleGraph(data: GraphData, state: Pick<ViewState, 'root' | 'focus' | 'expanded' | 'categories' | 'compare'> & Partial<Pick<ViewState, 'period' | 'temporal'>>): Pick<GraphData, 'entities' | 'relations'> {
  const trail = new Set([state.root, ...state.expanded, state.focus]);
  const centers = new Set(state.compare ? [state.root, state.compare] : [state.focus]);
  const anchor = data.relations.find(relation => relation.id === state.period);
  const relations = data.relations.filter(relation => state.categories.includes(relation.category) && matchesPeriod(relation, anchor, state.compare ? 'all' : state.temporal) && (centers.has(relation.source) || centers.has(relation.target) || (trail.has(relation.source) && trail.has(relation.target))));
  const visible = new Set([...trail, ...centers]);
  for (const relation of relations) { visible.add(relation.source); visible.add(relation.target); }
  return { entities: data.entities.filter(entity => visible.has(entity.id)), relations };
}

export function getGraphPage(graph: Pick<GraphData, 'entities' | 'relations'>, state: Pick<ViewState, 'root' | 'focus' | 'expanded' | 'page'>) {
  const fixed = new Set([state.root, state.focus, ...state.expanded]);
  const neighbors = graph.entities.filter(entity => !fixed.has(entity.id)).sort((a, b) => a.label.localeCompare(b.label, 'fr') || a.id.localeCompare(b.id));
  const pageSize = neighbors.length > 24 ? 12 : Math.max(neighbors.length, 1);
  const pageCount = Math.max(1, Math.ceil(neighbors.length / pageSize));
  const page = Math.max(0, Math.min(state.page, pageCount - 1));
  const shown = new Set([...fixed, ...neighbors.slice(page * pageSize, (page + 1) * pageSize).map(entity => entity.id)]);
  return { entities: graph.entities.filter(entity => shown.has(entity.id)), relations: graph.relations.filter(relation => shown.has(relation.source) && shown.has(relation.target)), page, pageCount, pageSize, neighborIds: neighbors.map(entity => entity.id) };
}

export function getCommonConnections(data: GraphData, leftId: string, rightId: string, categories: Category[]): CommonConnection[] {
  if (leftId === rightId) return [];
  const left = data.relations.filter(relation => relation.source === leftId && categories.includes(relation.category));
  const right = data.relations.filter(relation => relation.source === rightId && categories.includes(relation.category));
  return data.entities.flatMap(entity => {
    const a = left.filter(relation => relation.target === entity.id);
    const b = right.filter(relation => relation.target === entity.id);
    return a.length && b.length ? [{ entity, left: a, right: b }] : [];
  }).sort((a, b) => Number(b.entity.type === 'school') - Number(a.entity.type === 'school') || a.entity.label.localeCompare(b.entity.label, 'fr'));
}

export function parseView(search: string, data: GraphData): ViewState {
  const params = new URLSearchParams(search);
  const ids = new Set(data.entities.map(entity => entity.id));
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
  const state: ViewState = {
    root, focus, expanded,
    categories: categories.length || requestedCategories === '' ? categories : [...CATEGORIES],
    selected: ids.has(params.get('selected') ?? '') ? params.get('selected')! : root,
    compare: validComparison ? compare : null,
    mode: params.get('mode') === 'list' ? 'list' : 'graph',
    edge: data.relations.some(relation => relation.id === params.get('edge')) ? params.get('edge') : null,
    temporal: 'all', period: null, page: /^[1-9]\d{0,4}$/.test(params.get('page') ?? '') ? Number(params.get('page')) : 0,
  };
  const requestedPeriod = params.get('period');
  const period = data.relations.find(relation => relation.id === requestedPeriod && periodBounds(relation));
  if (period) return { ...state, period: period.id, temporal: params.get('time') === 'same' && !validComparison ? 'same' : 'all' };
  if (!requestedPeriod && !validComparison) {
    const context = getPeriodContext(data, state);
    const initialPeriod = context.options.find(option => option.cohort) ?? context.options[0];
    if (initialPeriod && focus !== root) return { ...state, period: initialPeriod.id, temporal: params.get('time') === 'all' ? 'all' : 'same' };
  }
  return state;
}

export function serializeView(state: ViewState): string {
  const params = new URLSearchParams({ root: state.root, focus: state.focus, expanded: [...new Set(state.expanded)].join(','), categories: CATEGORIES.filter(category => state.categories.includes(category)).join(','), selected: state.selected });
  if (state.compare) params.set('compare', state.compare);
  if (state.mode === 'list') params.set('mode', 'list');
  if (state.edge) params.set('edge', state.edge);
  params.set('time', state.temporal);
  if (state.period) params.set('period', state.period);
  if (state.page > 0) params.set('page', String(state.page));
  return `?${params}`;
}
