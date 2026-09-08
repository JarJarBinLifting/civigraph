'use client';

import { ArrowUpRight, BookOpen } from 'lucide-react';
import { useMemo } from 'react';
import { getCareerTimeline, getPersonProfile, type CareerEntry } from '@/lib/profile';
import { categoryInfo, periodLabel, shortLabel } from '@/lib/presentation';
import type { Entity, GraphData } from '@/lib/types';
import { personMilieus } from '@/lib/network-insights';
import { MilieuEvidence } from './NetworkInsights';

export function PersonProfile({ data, person, mode, onMode, onSelect, onExplore, onEvidence, onConnections }: { data: GraphData; person: Entity; mode: 'overview' | 'career'; onMode: (mode: 'overview' | 'career') => void; onSelect: (id: string) => void; onExplore: (id: string) => void; onEvidence: (id: string) => void; onConnections: () => void }) {
  const profile = useMemo(() => getPersonProfile(data, person), [data, person]);
  const career = useMemo(() => getCareerTimeline(data, person), [data, person]);
  const milieuProfile = useMemo(() => personMilieus(data, data.relations.filter(r => r.source === person.id))[0], [data, person.id]);
  return <div className="person-biography">
    <div className="profile-view-switch" role="group" aria-label="Lecture du profil"><button aria-pressed={mode === 'overview'} onClick={() => onMode('overview')}>En bref</button><button aria-pressed={mode === 'career'} onClick={() => onMode('career')}>Parcours</button></div>
    {mode === 'career' ? <section className="career-timeline" aria-label="Parcours chronologique">
      <h3>Parcours documenté</h3>
      <p className="profile-scope">Toutes les catégories et toutes les périodes du profil. Les activités peuvent se chevaucher. Une borne manquante reste inconnue.</p>
      <ol>{career.dated.map(entry => <CareerItem key={entry.key} entry={entry} onEvidence={onEvidence} onSelect={onSelect} onExplore={onExplore} />)}</ol>
      {!career.dated.length && <p className="section-caption">Aucun passage avec une date exploitable dans ce corpus.</p>}
      {career.undated.length > 0 && <><h3>Sans dates exploitables</h3><ol className="undated-career">{career.undated.map(entry => <CareerItem key={entry.key} entry={entry} onEvidence={onEvidence} onSelect={onSelect} onExplore={onExplore} />)}</ol></>}
    </section> : <>
    <span className="eyebrow">En bref</span>
    <div className="profile-overview">{profile.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
    <p className="profile-scope">Repères issus des sources du corpus, sur l’ensemble du parcours. Une fin absente ne signifie pas une fonction actuelle.</p>
    {milieuProfile && milieuProfile.milieus.length >= 2 && <section className="profile-section"><h3>Entre plusieurs milieux</h3><MilieuEvidence profile={milieuProfile} data={data} /></section>}
    {profile.sections.map(section => <section className="profile-section" key={section.category}>
      <h3>{categoryInfo[section.category].label}</h3>
      {section.facts.map(({ entity, relation }) => <article className="profile-fact" key={relation.id}>
        <div><strong>{shortLabel(entity)}</strong>{relation.role && <span>{relation.role}</span>}<small>{periodLabel(relation)}</small></div>
        <button className="icon-button" aria-label={`Source du repère ${shortLabel(entity)}`} onClick={() => onEvidence(relation.id)}><BookOpen size={14} /></button>
      </article>)}
      {section.total > section.facts.length && <small className="profile-more">{section.total - section.facts.length} autres repères dans Connexions</small>}
    </section>)}
    <button className="subtle-link profile-all" onClick={onConnections}>Explorer ses connexions<ArrowUpRight size={13} /></button>
    </>}
  </div>;
}

function CareerItem({ entry, onEvidence, onSelect, onExplore }: { entry: CareerEntry; onEvidence: (id: string) => void; onSelect: (id: string) => void; onExplore: (id: string) => void }) {
  const relation = entry.relations[0];
  return <li className="career-entry" style={{ '--entry-color': categoryInfo[entry.category].color } as React.CSSProperties}>
    <p className="career-date">{periodLabel(relation)}</p>
    <span className="eyebrow">{categoryInfo[entry.category].singular}</span>
    <button className="career-institution" onClick={() => onSelect(entry.entity.id)}>{shortLabel(entry.entity)}<ArrowUpRight size={12} /></button>
    {relation.role && <p className="career-role">{relation.role}</p>}
    <button className="subtle-link" onClick={() => onExplore(entry.entity.id)}>Explorer ce réseau<ArrowUpRight size={12} /></button>
    <div className="career-proofs">{entry.relations.map((proof, i) => <button key={proof.id} onClick={() => onEvidence(proof.id)} aria-label={`Source ${i + 1} du passage ${shortLabel(entry.entity)}`}><BookOpen size={12} />{entry.relations.length > 1 ? `Source ${i + 1}` : 'Source'} · {proof.evidence ? 'Document public' : 'Wikidata'}</button>)}</div>
  </li>;
}
