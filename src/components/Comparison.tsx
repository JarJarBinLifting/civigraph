'use client';

import { ArrowRight, ArrowUpRight, GitCompareArrows, X } from 'lucide-react';
import { EntitySearch } from './EntitySearch';
import { RelationEvidence } from './DetailPanel';
import { getCommonConnections } from '@/lib/graph';
import { initials, shortLabel, typeInfo } from '@/lib/presentation';
import type { Category, Entity, GraphData } from '@/lib/types';

export function Comparison({ data, left, right, categories, onLeft, onRight, onExplore, onClose }: {
  data: GraphData; left: Entity; right: Entity | undefined; categories: Category[];
  onLeft: (entity: Entity) => void; onRight: (entity: Entity) => void; onExplore: (id: string) => void; onClose: () => void;
}) {
  const common = right ? getCommonConnections(data, left.id, right.id, categories) : [];
  return <section className="comparison-view" aria-label="Comparer deux personnes">
    <div className="comparison-heading"><div><span className="eyebrow">Les parcours se croisent</span><h2>Qu’ont-ils en commun ?</h2></div><button className="icon-button" aria-label="Fermer la comparaison" onClick={onClose}><X size={19} /></button></div>
    <p className="comparison-lede">Deux parcours, des institutions communes. Retrouvez les liens et les périodes qui les documentent.</p>
    <div className="compare-pickers">
      <div><div className="compare-person"><span className="mini-avatar">{initials(left.label)}</span><strong>{left.label}</strong></div><EntitySearch data={data} peopleOnly exclude={right?.id} onSelect={onLeft} label="Première personne à comparer" placeholder="Changer la première personne…" /></div>
      <GitCompareArrows size={24} className="compare-symbol" />
      <div>{right ? <div className="compare-person"><span className="mini-avatar ochre">{initials(right.label)}</span><strong>{right.label}</strong></div> : <p className="compare-person muted">Choisir un second parcours</p>}<EntitySearch data={data} peopleOnly exclude={left.id} onSelect={onRight} label="Deuxième personne à comparer" placeholder="Rechercher une personne…" /></div>
    </div>
    {!right && <div className="comparison-suggestions"><span className="eyebrow">Pour commencer</span>{['Q3579995', 'Q20020731', 'Q157'].filter(id => id !== left.id).map(id => {
      const person = data.entities.find(entity => entity.id === id)!;
      return <button key={id} onClick={() => onRight(person)}>{person.label}<ArrowUpRight size={15} /></button>;
    })}</div>}
    {right && <><div className="comparison-result-heading"><strong>{common.length} {common.length === 1 ? 'point commun documenté' : 'points communs documentés'}</strong><span>Selon les filtres actifs</span></div>
      <div className="comparison-note">Un établissement ou une fonction en commun ne prouve ni une rencontre, ni une collaboration. Les périodes peuvent être différentes.</div>
      {common.map(connection => <article className="common-card" key={connection.entity.id}>
        <div className="common-card-heading"><span className="mini-avatar" style={{ color: typeInfo[connection.entity.type].color, background: typeInfo[connection.entity.type].soft }}>{initials(shortLabel(connection.entity))}</span><div><span className="eyebrow">{typeInfo[connection.entity.type].label}</span><h3>{shortLabel(connection.entity)}</h3></div><button className="icon-button" aria-label={`Explorer ${shortLabel(connection.entity)}`} onClick={() => onExplore(connection.entity.id)}><ArrowRight size={18} /></button></div>
        <div className="common-evidence"><div>{connection.left.map(relation => <RelationEvidence key={relation.id} relation={relation} data={data} compact />)}</div><div>{connection.right.map(relation => <RelationEvidence key={relation.id} relation={relation} data={data} compact />)}</div></div>
      </article>)}
      {!common.length && <div className="empty-state"><GitCompareArrows size={28} /><strong>Aucun point commun dans cette vue</strong><p>Essayez d’autres filtres ou une autre personne. L’absence de résultat dans ce corpus limité ne démontre pas l’absence de lien.</p></div>}
    </>}
  </section>;
}
