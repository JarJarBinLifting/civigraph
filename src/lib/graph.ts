import { CATEGORIES, type Category, type CommonConnection, type GraphData, type ViewState } from './types';
import { shortLabel } from './presentation';

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim();

export function searchEntities(data: GraphData, query: string, peopleOnly = false): GraphData['entities'] {
  const term = normalize(query);
  const names = (entity: GraphData['entities'][number]) => [normalize(entity.label), normalize(shortLabel(entity))];
  return data.entities
    .filter(entity => (!peopleOnly || (entity.type === 'person' && entity.inCorpus)) && (!term || names(entity).some(name => name.includes(term)) || entity.id.toLowerCase() === term))
    .sort((a, b) => Number(names(b).some(name => name === term)) - Number(names(a).some(name => name === term)) || Number(names(b).some(name => name.startsWith(term))) - Number(names(a).some(name => name.startsWith(term))) || Number(b.inCorpus) - Number(a.inCorpus) || a.label.localeCompare(b.label, 'fr'));
}

export function getVisibleGraph(data: GraphData, state: Pick<ViewState, 'root' | 'expanded' | 'categories' | 'compare'>): Pick<GraphData, 'entities' | 'relations'> {
  const expanded = new Set([state.root, ...state.expanded]);
  if (state.compare) expanded.add(state.compare);
  const relations = data.relations.filter(relation => state.categories.includes(relation.category) && (expanded.has(relation.source) || expanded.has(relation.target)));
  const visible = new Set(expanded);
  for (const relation of relations) { visible.add(relation.source); visible.add(relation.target); }
  return { entities: data.entities.filter(entity => visible.has(entity.id)), relations };
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
  const compare = params.get('compare');
  const rootIsPerson = data.entities.some(entity => entity.id === root && entity.type === 'person');
  const validComparison = rootIsPerson && compare !== root && data.entities.some(entity => entity.id === compare && entity.type === 'person' && entity.inCorpus);
  return {
    root, expanded,
    categories: categories.length || requestedCategories === '' ? categories : [...CATEGORIES],
    selected: ids.has(params.get('selected') ?? '') ? params.get('selected')! : root,
    compare: validComparison ? compare : null,
    mode: params.get('mode') === 'list' ? 'list' : 'graph',
    edge: data.relations.some(relation => relation.id === params.get('edge')) ? params.get('edge') : null,
  };
}

export function serializeView(state: ViewState): string {
  const params = new URLSearchParams({ root: state.root, expanded: [...new Set(state.expanded)].join(','), categories: CATEGORIES.filter(category => state.categories.includes(category)).join(','), selected: state.selected });
  if (state.compare) params.set('compare', state.compare);
  if (state.mode === 'list') params.set('mode', 'list');
  if (state.edge) params.set('edge', state.edge);
  return `?${params}`;
}
