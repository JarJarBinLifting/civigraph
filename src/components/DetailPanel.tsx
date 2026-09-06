'use client';

import { useState } from 'react';
import { ArrowUpRight, BookOpen, CalendarDays, ExternalLink, GitBranch, Link2, Plus, X } from 'lucide-react';
import { categoryInfo, hasExternalReference, initials, periodLabel, shortLabel, typeInfo } from '@/lib/presentation';
import type { Category, Entity, GraphData, Relation } from '@/lib/types';

export function RelationEvidence({ relation, data, compact = false }: { relation: Relation; data: GraphData; compact?: boolean }) {
  const source = data.entities.find(entity => entity.id === relation.source)!;
  const target = data.entities.find(entity => entity.id === relation.target)!;
  const urls = [...new Set(relation.references.flatMap(reference => reference.urls))];
  const statedIn = [...new Set(relation.references.flatMap(reference => reference.statedIn))];
  return <article className={`evidence-card ${compact ? 'compact' : ''}`}>
    <span className="relation-kind" style={{ color: categoryInfo[relation.category].color }}><span className="dot" />{categoryInfo[relation.category].singular}</span>
    <p className="evidence-statement"><strong>{source.label}</strong><span>{relation.label.toLowerCase()}</span><strong>{shortLabel(target)}</strong></p>
    <p className="period"><CalendarDays size={13} />{periodLabel(relation)}</p>
    {relation.contexts?.length ? <p className="context-note">Périmètre précisé dans la déclaration : {relation.contexts.map(context => context.label).join(' · ')}.</p> : null}
    <div className="evidence-links">
      <a href={relation.statementUrl} target="_blank" rel="noopener noreferrer"><BookOpen size={14} />Déclaration Wikidata<ArrowUpRight size={14} /></a>
      <a href={relation.revisionUrl} target="_blank" rel="noopener noreferrer">Version lors de l’import<ArrowUpRight size={13} /></a>
      {urls.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} />Référence {index + 1} · {new URL(url).hostname.replace(/^www\./, '')}<ArrowUpRight size={13} /></a>)}
      {statedIn.map(id => <a key={id} href={`https://www.wikidata.org/wiki/${id}`} target="_blank" rel="noopener noreferrer">Publication citée · {id}<ArrowUpRight size={13} /></a>)}
    </div>
    {!urls.length && <p className="source-limit">{statedIn.length ? 'Publication citée dans Wikidata, sans URL externe directe.' : 'Aucune référence externe directe fournie par Wikidata.'} Déclaration à recouper.</p>}
  </article>;
}

interface Props {
  data: GraphData;
  entity: Entity;
  categories: Category[];
  selectedEdge: Relation | undefined;
  expanded: boolean;
  onSelect: (id: string) => void;
  onEdge: (id: string | null) => void;
  onExpand: (id: string) => void;
  onClose: () => void;
}

export function DetailPanel({ data, entity, categories, selectedEdge, expanded, onSelect, onEdge, onExpand, onClose }: Props) {
  const [tab, setTab] = useState<'connections' | 'sources'>('connections');
  const allRelations = data.relations.filter(relation => (relation.source === entity.id || relation.target === entity.id) && categories.includes(relation.category));
  const groups = new Map<string, Relation[]>();
  for (const relation of allRelations) {
    const neighbor = relation.source === entity.id ? relation.target : relation.source;
    const groupKey = `${neighbor}|${relation.category}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), relation]);
  }
  const activeTab = selectedEdge ? 'sources' : tab;
  const connectionCount = new Set(allRelations.map(relation => relation.source === entity.id ? relation.target : relation.source)).size;
  return <aside className="detail-panel" aria-label={`Fiche de ${entity.label}`}>
    <div className="panel-topline"><span className="eyebrow">Fiche {entity.type === 'person' ? 'personnalité' : 'entité'}</span><button className="icon-button" aria-label="Fermer la fiche" onClick={onClose}><X size={17} /></button></div>
    <div className="entity-profile">
      <div className="profile-avatar" style={{ background: typeInfo[entity.type].soft, color: typeInfo[entity.type].color }}>{initials(entity.label)}<span className="profile-node" /></div>
      <span className="type-label">{typeInfo[entity.type].label}</span>
      <h2>{shortLabel(entity)}</h2>
      <p>{entity.description || entity.label}</p>
      <a className="subtle-link" href={entity.wikidataUrl} target="_blank" rel="noopener noreferrer">Fiche Wikidata<ArrowUpRight size={13} /></a>
    </div>
    <div className="profile-stats"><div><strong>{connectionCount}</strong><span>entités liées</span></div><div><strong>{allRelations.length}</strong><span>déclarations</span></div></div>
    <button className="primary-button expand-button" onClick={() => onExpand(entity.id)} disabled={expanded}><GitBranch size={16} />{expanded ? 'Réseau développé' : 'Développer ce réseau'}{!expanded && <Plus size={15} />}</button>
    <div className="panel-tabs" role="tablist" aria-label="Contenu de la fiche">
      <button role="tab" aria-selected={activeTab === 'connections'} onClick={() => { setTab('connections'); onEdge(null); }}>Connexions <span>{connectionCount}</span></button>
      <button role="tab" aria-selected={activeTab === 'sources'} onClick={() => { setTab('sources'); onEdge(null); }}>Sources <ArrowUpRight size={13} /></button>
    </div>
    <div className="panel-content" role="tabpanel" aria-label={activeTab === 'connections' ? 'Connexions de l’entité' : 'Sources des relations'}>
      {activeTab === 'connections' ? <>
        <p className="section-caption">{categories.length === 5 ? 'Tous les liens du corpus' : 'Liens selon les filtres actifs'}</p>
        {[...groups.entries()].map(([key, group]) => {
          const relation = group[0];
          const neighborId = relation.source === entity.id ? relation.target : relation.source;
          const neighbor = data.entities.find(item => item.id === neighborId)!;
          return <div className="connection-row" key={key}>
            <span className="connection-dot" style={{ background: categoryInfo[relation.category].color }} />
            <div><span className="connection-category">{categoryInfo[relation.category].singular}</span>
              <button className="connection-name" onClick={() => onSelect(neighbor.id)}>{shortLabel(neighbor)}<ArrowUpRight size={12} /></button>
              <small>{group.length > 1 ? `${group.length} déclarations · plusieurs périodes` : periodLabel(relation)}</small>
            </div>
            <button className="icon-button proof-button" aria-label={`Voir la source du lien avec ${shortLabel(neighbor)}`} onClick={() => onEdge(relation.id)}><Link2 size={15} /></button>
          </div>;
        })}
      </> : <>
        <div className="source-intro"><BookOpen size={16} /><p>Chaque lien renvoie à sa déclaration. Les références externes sont affichées lorsqu’elles sont disponibles.</p></div>
        {selectedEdge ? <><button className="subtle-link" onClick={() => { onEdge(null); setTab('sources'); }}>Voir toutes les déclarations ({allRelations.length})</button><RelationEvidence relation={selectedEdge} data={data} /></> : allRelations.map(relation => <RelationEvidence key={relation.id} relation={relation} data={data} compact />)}
      </>}
      {!allRelations.length && !selectedEdge && <div className="empty-state"><GitBranch size={25} /><strong>Aucun lien avec ces filtres</strong><p>Réactivez une catégorie pour retrouver les relations de cette entité.</p></div>}
    </div>
    <div className="panel-footer"><span className="status-dot" />Wikidata · {allRelations.filter(hasExternalReference).length} déclarations avec URL externe</div>
  </aside>;
}
