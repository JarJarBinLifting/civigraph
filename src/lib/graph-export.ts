import type { GraphData, ViewState } from './types';
import type { Chronology } from './graph-layout';
import { TIME_BANDS } from './graph-layout';
import { getGraphIndex } from './graph-index';
import { serializeView } from './graph';
import { categoryInfo, periodLabel } from './presentation';
export interface GraphExportInfo { title: string; context: string[]; legend: { label: string; color: string }[]; notes: string[]; query: string; filename: string; credits: string[] }
export function graphExportInfo(data: GraphData, view: ViewState, graph: Pick<GraphData, 'entities' | 'relations'>, chronology: Chronology): GraphExportInfo {
  const index = getGraphIndex(data);
  const focus = index.entities.get(view.focus)!;
  const selected = index.entities.get(view.selected);
  const period = index.relations.get(view.period ?? '');
  return {
    title: `Réseau de ${focus.label}`,
    context: [
      `Parcours : ${view.expanded.map(id => index.entities.get(id)?.label ?? id).join(' → ')}`,
      ...(selected && selected.id !== focus.id ? [`Sélection : ${selected.label}`] : []),
      `${graph.entities.length} entités · ${graph.relations.length} déclarations dans le réseau filtré`,
      view.categories.length ? `Catégories : ${view.categories.map(category => categoryInfo[category].label).join(' · ')}` : 'Aucune catégorie active',
      view.temporal === 'same' && period ? `Filtre : même période documentée · ${period.cohort?.label ?? periodLabel(period)}` : 'Toutes périodes · aucun filtre de présence simultanée',
      `Référence temporelle : ${chronology.reference.label}`,
      `Instantané du corpus : ${new Date(data.meta.supplementedAt ?? data.meta.fetchedAt).toLocaleDateString('fr-FR', { timeZone: 'UTC' })}`,
    ],
    legend: view.categories.map(category => ({ label: categoryInfo[category].label, color: categoryInfo[category].color })),
    notes: [
      `Entités du réseau : ${graph.entities.map(entity => entity.label).join(' · ')}.`,
      `Couronnes : ${TIME_BANDS.join(' · ')}. Dates inconnues : hors échelle.`,
      'Les distances représentent des classes d’écart temporel, pas une mesure d’influence. L’année repère seule ne filtre pas les personnes en fonction.',
      'Un lien documenté n’implique pas une proximité personnelle. Plusieurs déclarations peuvent documenter un même fait. Corpus non exhaustif.',
      'Cadrage courant : certaines entités peuvent être hors champ. Retrouvez les noms complets et chaque source dans la vue liée ci-dessous.',
    ],
    query: serializeView(view), filename: `civigraph-${view.focus.replace(/[^a-zA-Z0-9_-]/g, '-')}.png`,
    credits: graph.entities.flatMap(entity => entity.image ? [`${entity.label} — ${entity.image.attribution || entity.image.author}. ${entity.image.license} : ${entity.image.licenseUrl} · ${entity.image.sourcePage} · Vignette redimensionnée ou recadrée ; licence d’origine conservée.`] : []),
  };
}
