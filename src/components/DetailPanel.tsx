'use client';

import { useState } from 'react';
import { ArrowUpRight, BookOpen, CalendarDays, ExternalLink, GitBranch, Link2, Plus, X } from 'lucide-react';
import { categoryInfo, hasExternalReference, periodLabel, shortLabel, typeInfo } from '@/lib/presentation';
import type { Category, Entity, GraphData, Relation, ViewState } from '@/lib/types';
import { matchesPeriod } from '@/lib/graph';
import { PersonProfile } from './PersonProfile';
import { getGraphIndex } from '@/lib/graph-index';
import { entityPath } from '@/lib/publication';
import { EntityAvatar } from './EntityAvatar';
import { ImageCredit } from './ImageCredit';
import { compareRelationsChronologically } from '@/lib/chronology';

export function RelationEvidence({ relation, data, compact = false }: { relation: Relation; data: GraphData; compact?: boolean }) {
  const { entities } = getGraphIndex(data);
  const source = entities.get(relation.source)!;
  const target = entities.get(relation.target)!;
  const urls = [...new Set(relation.references.flatMap(reference => reference.urls))];
  const statedIn = [...new Set(relation.references.flatMap(reference => reference.statedIn))];
  return <article className={`evidence-card ${compact ? 'compact' : ''}`}>
    <span className="relation-kind" style={{ color: categoryInfo[relation.category].color }}><span className="dot" />{categoryInfo[relation.category].singular}</span>
    <p className="evidence-statement"><strong>{source.label}</strong><span>{relation.label.toLowerCase()}</span><strong>{shortLabel(target)}</strong></p>
    <p className="period"><CalendarDays size={13} />{periodLabel(relation)}</p>
    {relation.role && <p className="evidence-role">{relation.role}</p>}
    {relation.evidence && <div className="official-evidence"><span className="eyebrow">{relation.evidence.kind === 'declaration' ? 'Déclaration publique' : 'Source officielle'}</span><p>{relation.evidence.title}</p><small>{relation.evidence.locator}</small><p className="evidence-note">{relation.evidence.note}</p></div>}
    {relation.contexts?.length ? <p className="context-note">Périmètre précisé dans la déclaration : {relation.contexts.map(context => context.label).join(' · ')}.</p> : null}
    <div className="evidence-links">
      <a href={relation.statementUrl} target="_blank" rel="noopener noreferrer"><BookOpen size={14} />{relation.evidence?.kind === 'declaration' ? 'Consulter la déclaration HATVP' : relation.evidence ? 'Consulter le document officiel' : 'Déclaration Wikidata'}<ArrowUpRight size={14} /></a>
      {relation.revisionUrl && <a href={relation.revisionUrl} target="_blank" rel="noopener noreferrer">Version lors de l’import<ArrowUpRight size={13} /></a>}
      {urls.filter(url => !relation.evidence || url !== relation.statementUrl.split('#')[0]).map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} />Référence {index + 1} · {new URL(url).hostname.replace(/^www\./, '')}<ArrowUpRight size={13} /></a>)}
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
  focused: boolean;
  temporal: ViewState['temporal'];
  periodAnchor: Relation | undefined;
  onSelect: (id: string) => void;
  onEdge: (id: string | null) => void;
  onExpand: (id: string) => void;
  onClose: () => void;
  onAllPeriods: () => void;
  onCareer: (id: string) => void;
}

export function DetailPanel({ data, entity, categories, temporal, periodAnchor, selectedEdge, focused, onSelect, onEdge, onExpand, onClose, onAllPeriods, onCareer }: Props) {
  const [tab, setTab] = useState<'profile' | 'connections' | 'sources'>(entity.type === 'person' ? 'profile' : 'connections');
  const [profileMode, setProfileMode] = useState<'overview' | 'career'>('overview');
  const index = getGraphIndex(data);
  const availableRelations = (index.incident.get(entity.id) ?? []).filter(relation => categories.includes(relation.category));
  const allRelations = availableRelations.filter(relation => matchesPeriod(relation, periodAnchor, temporal)).sort(compareRelationsChronologically);
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
      <EntityAvatar entity={entity} className="profile-avatar" decorative={false} />
      <span className="type-label">{typeInfo[entity.type].label}</span>
      <h2>{shortLabel(entity)}</h2>
      <p>{entity.description || entity.label}</p>
      {entity.image && <ImageCredit image={entity.image} />}
      <a className="subtle-link" href={entityPath(entity.id)}>Notice documentaire<ArrowUpRight size={13} /></a>
      {(entity.wikidataUrl || entity.sourceUrl) && <a className="subtle-link" href={entity.wikidataUrl ?? entity.sourceUrl} target="_blank" rel="noopener noreferrer">{entity.wikidataUrl ? 'Fiche Wikidata' : entity.sourceLabel ?? 'Source de l’entité'}<ArrowUpRight size={13} /></a>}
      {entity.labelSource && <a className="subtle-link" href={entity.labelSource.url} target="_blank" rel="noopener noreferrer">{entity.labelSource.title}<ArrowUpRight size={13} /></a>}
    </div>
    <div className="profile-stats"><div><strong>{connectionCount}</strong><span>entités liées</span></div><div><strong>{allRelations.length}</strong><span>déclarations</span></div></div>
    <button className="primary-button expand-button" onClick={() => onExpand(entity.id)} disabled={focused}><GitBranch size={16} />{focused ? 'Au centre du graphe' : 'Développer ce réseau'}{!focused && <Plus size={15} />}</button>
    {entity.type === 'person' && temporal === 'same' && <button className="career-button" onClick={() => onCareer(entity.id)}>Explorer toute sa carrière<ArrowUpRight size={14} /></button>}
    <div className="panel-tabs" role="tablist" aria-label="Contenu de la fiche">
      {entity.type === 'person' && <button role="tab" aria-selected={activeTab === 'profile'} onClick={() => { setTab('profile'); onEdge(null); }}>Profil</button>}
      <button role="tab" aria-selected={activeTab === 'connections'} onClick={() => { setTab('connections'); onEdge(null); }}>Connexions <span>{connectionCount}</span></button>
      <button role="tab" aria-selected={activeTab === 'sources'} onClick={() => { setTab('sources'); onEdge(null); }}>Sources <ArrowUpRight size={13} /></button>
    </div>
    <div className="panel-content" role="tabpanel" aria-label={activeTab === 'profile' ? 'Profil de la personne' : activeTab === 'connections' ? 'Connexions de l’entité' : 'Sources des relations'}>
      {activeTab === 'profile' ? <PersonProfile data={data} person={entity} mode={profileMode} onMode={setProfileMode} onSelect={onSelect} onExplore={onExpand} onEvidence={onEdge} onConnections={() => { setTab('connections'); onEdge(null); }} /> : activeTab === 'connections' ? <>
        <p className="section-caption">{temporal === 'same' ? 'Participations selon la période retenue' : categories.length === 5 ? 'Tous les liens du corpus' : 'Liens selon les filtres actifs'}{entity.id === 'Q2986712' && ' · sélection non exhaustive'}</p>
        {[...groups.entries()].map(([key, group]) => {
          const relation = group[0];
          const neighborId = relation.source === entity.id ? relation.target : relation.source;
          const neighbor = index.entities.get(neighborId)!;
          return <div className="connection-row" key={key}>
            <span className="connection-dot" style={{ background: categoryInfo[relation.category].color }} />
            <div><span className="connection-category">{categoryInfo[relation.category].singular}</span>
              <button className="connection-name" onClick={() => onSelect(neighbor.id)}>{shortLabel(neighbor)}<ArrowUpRight size={12} /></button>
              {group.filter(item => item.role).map(item => <small className="connection-role" key={item.id}>{item.role}{group.length > 1 && ` · ${item.cohort?.label ?? periodLabel(item)}`}</small>)}
              <small>{group.length > 1 ? `${group.length} déclarations · plusieurs périodes` : relation.cohort?.label ?? periodLabel(relation)}</small>
            </div>
            <button className="icon-button proof-button" aria-label={`Voir la source du lien avec ${shortLabel(neighbor)}`} onClick={() => onEdge(relation.id)}><Link2 size={15} /></button>
          </div>;
        })}
      </> : <>
        <div className="source-intro"><BookOpen size={16} /><p>Chaque lien renvoie à sa déclaration. Les références externes sont affichées lorsqu’elles sont disponibles.</p></div>
        {selectedEdge ? <><button className="subtle-link" onClick={() => { onEdge(null); setTab('sources'); }}>Voir toutes les déclarations ({allRelations.length})</button><RelationEvidence relation={selectedEdge} data={data} /></> : allRelations.map(relation => <RelationEvidence key={relation.id} relation={relation} data={data} compact />)}
      </>}
      {activeTab !== 'profile' && !allRelations.length && !selectedEdge && <div className="empty-state"><GitBranch size={25} /><strong>Aucun lien avec ces filtres</strong><p>{temporal === 'same' ? 'Les dates disponibles ne permettent pas de retenir un lien sur cette période avec ces catégories.' : 'Réactivez une catégorie pour retrouver les relations de cette entité.'}</p></div>}
      {activeTab !== 'profile' && temporal === 'same' && availableRelations.length > allRelations.length && <button className="all-periods-link" onClick={onAllPeriods}>Voir les {availableRelations.length} liens en toutes périodes<ArrowUpRight size={13} /></button>}
    </div>
    <div className="panel-footer"><span className="status-dot" />{allRelations.some(relation => relation.evidence) ? 'Documents officiels et Wikidata' : 'Wikidata'} · {allRelations.filter(hasExternalReference).length} liens avec URL source</div>
  </aside>;
}
