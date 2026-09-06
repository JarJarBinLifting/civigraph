'use client';

import { ArrowUpRight, BookOpen } from 'lucide-react';
import { getPersonProfile } from '@/lib/profile';
import { categoryInfo, periodLabel, shortLabel } from '@/lib/presentation';
import type { Entity, GraphData } from '@/lib/types';

export function PersonProfile({ data, person, onEvidence, onConnections }: { data: GraphData; person: Entity; onEvidence: (id: string) => void; onConnections: () => void }) {
  const profile = getPersonProfile(data, person);
  return <div className="person-biography">
    <span className="eyebrow">En bref</span>
    <div className="profile-overview">{profile.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
    <p className="profile-scope">Repères issus des sources du corpus, sur l’ensemble du parcours. Une fin absente ne signifie pas une fonction actuelle.</p>
    {profile.sections.map(section => <section className="profile-section" key={section.category}>
      <h3>{categoryInfo[section.category].label}</h3>
      {section.facts.map(({ entity, relation }) => <article className="profile-fact" key={relation.id}>
        <div><strong>{shortLabel(entity)}</strong>{relation.role && <span>{relation.role}</span>}<small>{periodLabel(relation)}</small></div>
        <button className="icon-button" aria-label={`Source du repère ${shortLabel(entity)}`} onClick={() => onEvidence(relation.id)}><BookOpen size={14} /></button>
      </article>)}
      {section.total > section.facts.length && <small className="profile-more">{section.total - section.facts.length} autres repères dans Connexions</small>}
    </section>)}
    <button className="subtle-link profile-all" onClick={onConnections}>Explorer ses connexions<ArrowUpRight size={13} /></button>
  </div>;
}
