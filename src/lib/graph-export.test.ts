import { expect, test } from 'vitest';
import { loadDataset } from './dataset';
import { getVisibleGraph, parseView } from './graph';
import { getChronology, getTimeReference } from './graph-layout';
import { graphExportInfo } from './graph-export';
import { getSystemGraph } from './system-graph';

test('a formation export keeps the political color key and the actual system filter', () => {
  const data = loadDataset();
  const view = parseView('?graphView=system&system=education&reading=individuals', data);
  const graph = getSystemGraph(data, { ...view, categories: ['education'] });
  const info = graphExportInfo(data, view, graph, getChronology(graph, view.focus, getTimeReference(data, view)));
  expect(info.context).toContain('Système : Formation · lecture Individus');
  expect(info.context).toContain('Catégories : Formations');
  expect(info.legend.some(item => item.label === 'Parti socialiste')).toBe(true);
  expect(info.legend.some(item => item.label === 'Personnalité')).toBe(false);
});

test('system export explains topology without temporal rings or an unbounded list of names', () => {
  const data = loadDataset();
  const view = parseView('?graphView=system&year=2001', data);
  const graph = getSystemGraph(data, view);
  const info = graphExportInfo(data, view, graph, getChronology(graph, view.focus, getTimeReference(data, view)));
  expect(info.title).toBe('Système des liens documentés');
  expect(info.notes.join(' ')).toContain('voisins');
  expect(info.notes.join(' ')).not.toContain('Couronnes');
  expect(info.notes.join(' ').length).toBeLessThan(2000);
  expect(info.context.join(' ')).not.toContain('Référence temporelle');
  expect(info.query).toContain('graphView=system');
});
test('the exported receipt distinguishes filtered counts, temporal reference and actual period filter', () => {
  const data = loadDataset();
  const view = parseView('?root=Q3052772&focus=Q273579&expanded=Q3052772,Q273579&selected=Q273579&categories=education&time=all&year=2001', data);
  const graph = getVisibleGraph(data, view);
  const info = graphExportInfo(data, view, graph, getChronology(graph, view.focus, getTimeReference(data, view)));
  expect(info.title).toContain('École nationale');
  expect(info.context.join('\n')).toContain('Emmanuel Macron');
  expect(info.context.join('\n')).toContain('Toutes périodes');
  expect(info.context.join('\n')).toContain('2001');
  expect(info.context.join('\n')).toContain(String(graph.entities.length));
  expect(info.legend).toHaveLength(1);
  expect(info.notes.join('\n')).toMatch(/pas une mesure d’influence/);
  // The diagram uses generated type symbols; the sourced photos remain in profiles.
  expect(info.credits).toEqual([]);
  expect(info.notes.join('\n')).toContain('Disque : personne');
  expect(info.notes.join('\n')).toContain('rôle dans l’exploration');
  expect(info.query).toContain('year=2001');
  expect(parseView(info.query, data)).toEqual(view);
  const empty = { ...view, categories: [] };
  expect(graphExportInfo(data, empty, getVisibleGraph(data, empty), getChronology(graph, view.focus, getTimeReference(data, view))).context.join('\n')).toContain('Aucune catégorie');
});
