import { CATEGORIES, type Entity, type GraphData, type ViewState } from './types';
import { getGraphIndex } from './graph-index';
import { matchesPeriod } from './graph';

export interface SystemConnection { id: string; source: string; target: string; relations: string[] }
export interface SystemGraph extends Pick<GraphData, 'entities' | 'relations'> { connections: SystemConnection[]; neighbors: Map<string, Set<string>> }
export interface GraphCamera { key: string; zoom: number; x: number; y: number; baseZoom?: number }
export interface SystemLayoutInput { nodes: { id: string; degree: number }[]; edges: { id: string; source: string; target: string }[] }
export type SystemPositions = Record<string, { x: number; y: number }>;
export interface SystemGraphMemory { positions?: SystemPositions; camera?: GraphCamera; layouts?: Record<string, SystemPositions>; cameras?: Record<string, GraphCamera> }

/** Geometry depends on the topology, not labels or additional source statements. */
export async function systemTopologyHash(graph: SystemGraph): Promise<string> {
  const topology = JSON.stringify([
    graph.entities.map(e => e.id).sort(),
    graph.connections.map(c => c.id).sort(),
  ]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(topology));
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
}

export async function matchingSystemPositions(graph: SystemGraph, snapshot: { topologyHash: string; positions: SystemPositions }): Promise<SystemPositions | undefined> {
  if (Object.keys(snapshot.positions).length !== graph.entities.length || graph.entities.some(e => !Number.isFinite(snapshot.positions[e.id]?.x) || !Number.isFinite(snapshot.positions[e.id]?.y))) return undefined;
  return snapshot.topologyHash === await systemTopologyHash(graph) ? Object.fromEntries(Object.entries(snapshot.positions).map(([id, p]) => [id, { ...p }])) : undefined;
}

export function switchGraphView(view: ViewState, graphView: 'system' | 'centered'): ViewState {
  if (graphView === 'system') return { ...view, graphView };
  const focus = view.selected;
  const index = view.expanded.indexOf(focus);
  return { ...view, graphView, focus, expanded: index >= 0 ? view.expanded.slice(0, index + 1) : [...view.expanded, focus] };
}

export function getSystemGraph(data: GraphData, view: Pick<ViewState, 'categories' | 'temporal' | 'period' | 'selected'>): SystemGraph {
  const index = getGraphIndex(data);
  const anchor = index.relations.get(view.period ?? '');
  const relations = data.relations.filter(r => view.categories.includes(r.category) && matchesPeriod(r, anchor, view.temporal));
  const unfiltered = view.temporal === 'all' && CATEGORIES.every(c => view.categories.includes(c));
  const ids = new Set([view.selected]);
  const pairs = new Map<string, SystemConnection>();
  for (const r of relations) {
    ids.add(r.source); ids.add(r.target);
    const key = JSON.stringify([r.source, r.target].sort());
    let pair = pairs.get(key);
    if (!pair) { pair = { id: `system:${key}`, source: r.source, target: r.target, relations: [] }; pairs.set(key, pair); }
    pair.relations.push(r.id);
  }
  const entities = unfiltered ? data.entities : data.entities.filter(e => ids.has(e.id));
  const neighbors = new Map(entities.map(e => [e.id, new Set<string>()]));
  for (const pair of pairs.values()) { neighbors.get(pair.source)?.add(pair.target); neighbors.get(pair.target)?.add(pair.source); }
  return { entities, relations, connections: [...pairs.values()], neighbors };
}

export function systemNeighborhood(graph: Pick<SystemGraph, 'neighbors'>, root: string, depth: 1 | 2): Set<string> {
  const found = new Set<string>(graph.neighbors.has(root) ? [root] : []);
  let frontier = [...found];
  for (let step = 0; step < depth; step++) {
    const next: string[] = [];
    for (const id of frontier) for (const neighbor of graph.neighbors.get(id) ?? []) if (!found.has(neighbor)) { found.add(neighbor); next.push(neighbor); }
    frontier = next;
  }
  return found;
}

/** Selection can retain a filtered-out entity without rebuilding the topology. */
export function withSystemSelection(graph: SystemGraph, selected: Entity | undefined): SystemGraph {
  if (!selected || graph.neighbors.has(selected.id)) return graph;
  return { ...graph, entities: [...graph.entities, selected], neighbors: new Map([...graph.neighbors, [selected.id, new Set<string>()]]) };
}

export function systemLayoutInput(graph: SystemGraph): SystemLayoutInput {
  return { nodes: graph.entities.map(e => ({ id: e.id, degree: graph.neighbors.get(e.id)?.size ?? 0 })), edges: graph.connections.map(({ id, source, target }) => ({ id, source, target })) };
}

export function systemGraphKey(graph: SystemGraph): string {
  return JSON.stringify([graph.entities.map(e => e.id), graph.relations.map(r => r.id)]);
}
