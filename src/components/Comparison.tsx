'use client';

import { ArrowRight, GitCompareArrows, X } from 'lucide-react';
import { useMemo } from 'react';
import { EntitySearch } from './EntitySearch';
import { RelationEvidence } from './DetailPanel';
import { getCommonConnections } from '@/lib/graph';
import { shortLabel, typeInfo } from '@/lib/presentation';
import { EntityAvatar } from './EntityAvatar';
import { ImageCredit } from './ImageCredit';
import type { Category, Entity, GraphData } from '@/lib/types';
import { ComparisonGraph } from './ComparisonGraph';
import { comparisonPeriods } from '@/lib/comparison';
import { supportsPeriods } from '@/lib/temporal';
import { InstitutionPaths } from './InstitutionPaths';
import { ComparisonSuggestions } from './ComparisonSuggestions';
import { TemporalCrossings } from './TemporalCrossings';

export function Comparison({ data, left, right, categories, selected, presentation = 'map', mode = 'common', guided = false, onMode, onSelect, onPresentation, onLeft, onRight, onExplore, onClose }: {
  guided?: boolean;
  data: GraphData; left: Entity; right: Entity | undefined; categories: Category[];
  selected: string; presentation?: 'map' | 'cards'; onSelect: (id: string) => void; onPresentation: (view: 'map' | 'cards') => void;
  mode?: 'common' | 'paths' | 'crossings'; onMode: (mode: 'common' | 'paths' | 'crossings') => void;
  onLeft: (entity: Entity) => void; onRight: (entity: Entity) => void; onExplore: (id: string) => void; onClose: () => void;
}) {
  const common = useMemo(() => right ? getCommonConnections(data, left.id, right.id, categories) : [], [data, left.id, right, categories]);
  const institutions = common.filter(connection => supportsPeriods(connection.entity)).length;
  const statementCount = common.reduce((sum, connection) => sum + connection.left.length + connection.right.length, 0);
  function inspect(id: string) { onSelect(id); document.getElementById(`common-${id}`)?.scrollIntoView({ block: 'nearest' }); }
  return <section className="comparison-view" aria-label="Comparer deux personnes">
    <div className="comparison-heading"><div>{!guided && <><span className="eyebrow">Les parcours se croisent</span><h2>Qu’ont-ils en commun ?</h2></>}</div><button className="icon-button" aria-label="Fermer la comparaison" onClick={onClose}><X size={19} /></button></div>
    {!guided && <p className="comparison-lede">Deux parcours, des institutions communes. Retrouvez les liens et les périodes qui les documentent.</p>}
    <div className="compare-pickers">
      <div><div className="compare-person"><EntityAvatar entity={left} /><strong>{left.label}</strong></div><EntitySearch data={data} peopleOnly exclude={right?.id} onSelect={onLeft} label="Première personne à comparer" placeholder="Changer la première personne…" />{left.image && <ImageCredit image={left.image} />}</div>
      <GitCompareArrows size={24} className="compare-symbol" />
      <div>{right ? <div className="compare-person"><EntityAvatar entity={right} className="mini-avatar ochre" /><strong>{right.label}</strong></div> : <p className="compare-person muted">Choisir un second parcours</p>}<EntitySearch data={data} peopleOnly exclude={left.id} onSelect={onRight} label="Deuxième personne à comparer" placeholder="Rechercher une personne…" />{right?.image && <ImageCredit image={right.image} />}</div>
    </div>
    {!right && <ComparisonSuggestions data={data} person={left} categories={categories} onChoose={onRight} />}
    {right && <div className="comparison-mode" role="group" aria-label="Question de comparaison"><button aria-pressed={mode === 'common'} onClick={() => onMode('common')}>Points communs</button><button aria-pressed={mode === 'crossings'} onClick={() => onMode('crossings')}>Se sont-ils croisés ?</button><button aria-pressed={mode === 'paths'} onClick={() => onMode('paths')}>Chemins</button></div>}
    {right && mode === 'crossings' && <TemporalCrossings key={`${left.id}:${right.id}`} common={common} data={data} />}
    {right && mode === 'paths' && <InstitutionPaths data={data} left={left} right={right} categories={categories} onExplore={onExplore} />}
    {right && mode === 'common' && <><div className="comparison-result-heading"><strong>{common.length} {common.length === 1 ? 'point commun documenté' : 'points communs documentés'}</strong><span>Selon les filtres actifs</span></div>
      <p className="comparison-counts">{institutions} institutions · {common.length - institutions} autres entités ou fonctions · {statementCount} déclarations</p>
      <div className="comparison-note">Un établissement ou une fonction en commun ne prouve ni une rencontre, ni une collaboration. Les périodes peuvent être différentes.</div>
      {common.length > 0 && <><div className="view-toggle comparison-display" role="group" aria-label="Affichage de la comparaison"><button aria-pressed={presentation === 'map'} onClick={() => onPresentation('map')}>Carte comparative</button><button aria-pressed={presentation === 'cards'} onClick={() => onPresentation('cards')}>Cartes et sources</button></div>{presentation === 'map' && <ComparisonGraph left={left} right={right} common={common} selected={selected} onSelect={inspect} />}</>}
      {common.map(connection => <article className={`common-card ${selected === connection.entity.id ? 'is-selected' : ''}`} id={`common-${connection.entity.id}`} key={connection.entity.id}>
        <div className="common-card-heading"><EntityAvatar entity={connection.entity} /><div><span className="eyebrow">{typeInfo[connection.entity.type].label}</span><h3>{shortLabel(connection.entity)}</h3></div><button className="icon-button" aria-label={`Explorer ${shortLabel(connection.entity)}`} onClick={() => onExplore(connection.entity.id)}><ArrowRight size={18} /></button></div>
        {connection.entity.image && <ImageCredit image={connection.entity.image} />}
        {!supportsPeriods(connection.entity) && <p className="section-caption">Intitulé ou entité commune : ne suffit pas à identifier une même institution.</p>}
        <ComparisonPeriods connection={connection} />
        <div className="common-evidence"><div>{connection.left.map(relation => <RelationEvidence key={relation.id} relation={relation} data={data} compact />)}</div><div>{connection.right.map(relation => <RelationEvidence key={relation.id} relation={relation} data={data} compact />)}</div></div>
      </article>)}
      {!common.length && <div className="empty-state"><GitCompareArrows size={28} /><strong>Aucun point commun dans cette vue</strong><p>Essayez d’autres filtres ou une autre personne. L’absence de résultat dans ce corpus limité ne démontre pas l’absence de lien.</p></div>}
    </>}
  </section>;
}

function ComparisonPeriods({ connection }: { connection: Parameters<typeof comparisonPeriods>[0] }) {
  const periods = comparisonPeriods(connection);
  return <div className="comparison-periods"><strong>{periods.total} comparaisons de passages</strong><p>{[
    periods.documented ? `${periods.documented} avec chevauchement documenté` : '',
    periods.possible ? `${periods.possible} avec chevauchement possible` : '',
    periods.outside ? `${periods.outside} hors période commune` : '',
    periods.unknown ? `${periods.unknown} aux dates insuffisantes` : '',
  ].filter(Boolean).join(' · ')}</p><small>Chaque paire de déclarations est comparée séparément. Aucun chevauchement global ni rencontre n’en est déduit.</small></div>;
}
