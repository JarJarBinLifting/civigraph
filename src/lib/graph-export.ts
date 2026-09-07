import type { GraphData, ViewState } from './types';
import type { Chronology } from './graph-layout';
import { TIME_BANDS } from './graph-layout';
import { getGraphIndex } from './graph-index';
import { serializeView } from './graph';
import { categoryInfo, periodLabel, typeInfo } from './presentation';
import { categoriesForSystem, politicalAffiliations, SYSTEMS, UNKNOWN_POLITICAL_COLOR } from './system-reading';
export interface GraphExportInfo { title: string; context: string[]; legend: { label: string; color: string }[]; notes: string[]; query: string; filename: string; credits: string[] }
export function graphExportInfo(data: GraphData, view: ViewState, graph: Pick<GraphData, 'entities' | 'relations'>, chronology: Chronology): GraphExportInfo {
  const index = getGraphIndex(data);
  const focus = index.entities.get(view.focus)!;
  const selected = index.entities.get(view.selected);
  const period = index.relations.get(view.period ?? '');
  const system = view.graphView === 'system';
  const categories = system ? categoriesForSystem(view.system ?? 'all', view.categories) : view.categories;
  const people = new Set(graph.entities.filter(e => e.type === 'person').map(e => e.id));
  const politics = system ? politicalAffiliations(data) : undefined;
  const partyIds = new Set([...people].flatMap(id => (politics?.people.get(id) ?? []).map(a => a.party.id)));
  return {
    title: system ? 'Système des liens documentés' : `Réseau de ${focus.label}`,
    context: [
      ...(system ? [`Système : ${SYSTEMS.find(s => s.id === (view.system ?? 'all'))!.label} · lecture ${view.reading === 'individuals' ? 'Individus' : 'Groupes'}`] : []),
      ...(system ? [] : [`Parcours : ${view.expanded.map(id => index.entities.get(id)?.label ?? id).join(' → ')}`]),
      ...(selected && view.spotlight !== 'off' && selected.id !== focus.id ? [`Sélection : ${selected.label}`] : []),
      `${graph.entities.length} entités · ${graph.relations.length} déclarations dans le réseau filtré`,
      categories.length ? `Catégories : ${categories.map(category => categoryInfo[category].label).join(' · ')}` : 'Aucune catégorie active',
      view.temporal === 'same' && period ? `Filtre : même période documentée · ${period.cohort?.label ?? periodLabel(period)}` : 'Toutes périodes · aucun filtre de présence simultanée',
      ...(system ? [] : [`Référence temporelle : ${chronology.reference.label}`]),
      `Instantané du corpus : ${new Date(data.meta.supplementedAt ?? data.meta.fetchedAt).toLocaleDateString('fr-FR', { timeZone: 'UTC' })}`,
    ],
    legend: system ? [...new Set(graph.entities.filter(e => e.type !== 'person' && e.type !== 'party').map(e => e.type))].map(type => ({ label: typeInfo[type].label, color: typeInfo[type].color })).concat(politics!.parties.filter(p => partyIds.has(p.entity.id)).map(p => ({ label: p.entity.label, color: p.color })), [{ label: 'Appartenance non documentée', color: UNKNOWN_POLITICAL_COLOR }]) : view.categories.map(category => ({ label: categoryInfo[category].label, color: categoryInfo[category].color })),
    notes: [
      ...(system ? [
        'Disques : personnes. Couleurs : toutes les appartenances politiques documentées, historiques ou multiples, sans présumer une adhésion actuelle ou au moment du passage. Un disque partagé conserve plusieurs appartenances. Carrés : institutions ; en lecture Groupes, taille et nombre selon les personnes distinctes. Un trait regroupe les déclarations entre deux entités, consultables dans la fiche.',
        'La disposition rapproche les éléments connectés pour faciliter la lecture. Les distances ne mesurent ni influence, ni proximité personnelle, ni durée. Les voisins à deux étapes indiquent uniquement un chemin de deux liens documentés.',
      ] : [
      `Entités du réseau : ${graph.entities.map(entity => entity.label).join(' · ')}.`,
      `Couronnes : ${TIME_BANDS.join(' · ')}. Dates inconnues : hors échelle.`,
      'Secteurs : écoles en haut, fonctions à droite, entreprises et organisations à gauche, partis et statuts en bas. Les zones de dates inconnues sont séparées de l’échelle temporelle. Les réseaux de personnes se répartissent autour du centre.',
      'Disque : personne. Pictogramme : type d’entité. La taille du centre indique son rôle dans l’exploration. Contour marqué : sélection ; double contour : étape du parcours.',
      'Les distances représentent des classes d’écart temporel, pas une mesure d’influence. L’année repère seule ne filtre pas les personnes en fonction.',
      ]),
      'Un lien documenté n’implique pas une proximité personnelle. Plusieurs déclarations peuvent documenter un même fait. Corpus non exhaustif.',
      'Cadrage courant : certaines entités peuvent être hors champ. Retrouvez les noms complets et chaque source dans la vue liée ci-dessous.',
    ],
    query: serializeView(view), filename: `civigraph-${system ? 'systeme' : view.focus.replace(/[^a-zA-Z0-9_-]/g, '-')}.png`,
    // This canvas contains original diagram symbols, not the photographs in the profiles.
    credits: [],
  };
}
