'use client';

import { useState } from 'react';
import type { Entity, GraphData, Relation } from '@/lib/types';
import type { PoliticalIndex } from '@/lib/system-reading';
import type { SystemGraph } from '@/lib/system-graph';
import { periodLabel, shortLabel } from '@/lib/presentation';
import { PoliticalBadges } from './PoliticalLegend';
import { OverlapReceipt, PassageEvidence } from './PassageEvidence';

export function PersonAffiliations({ person, politics, data }: { person: Entity; politics: PoliticalIndex; data: GraphData }) {
  const affiliations = politics.people.get(person.id) ?? [];
  return <section className="person-affiliations" aria-label={`Appartenances politiques de ${person.label}`}><h3>Appartenances politiques documentées</h3><PoliticalBadges affiliations={affiliations} />
    <p>Toutes les périodes du corpus. Une date de fin manquante ne signifie pas une adhésion actuelle.</p>
    {affiliations.map(a => <details key={a.party.id}><summary><i style={{ background: a.color }} />{a.party.label}<small>{[...new Set(a.statements.map(periodLabel))].join(' · ')}</small></summary><PassageEvidence statements={a.statements} data={data} /></details>)}
    {!affiliations.length && <p>Aucune déclaration disponible dans ce corpus ; cela ne signifie pas « sans appartenance ».</p>}
  </section>;
}

export function InstitutionCrossings({ institution, graph, politics, data, group, onGroup, onSelect }: {
  institution: Entity; graph: SystemGraph; politics: PoliticalIndex; data: GraphData; group: string[];
  onGroup: (group: string[]) => void; onSelect: (id: string) => void;
}) {
  const [reference, setReference] = useState(''), [page, setPage] = useState(0), [query, setQuery] = useState('');
  const entities = new Map(data.entities.map(e => [e.id, e]));
  const passages = new Map<string, Relation[]>();
  for (const r of graph.relations) {
    const other = r.source === institution.id ? r.target : r.target === institution.id ? r.source : undefined;
    if (!other || entities.get(other)?.type !== 'person') continue;
    passages.set(other, [...(passages.get(other) ?? []), r]);
  }
  const people = [...passages.keys()].map(id => entities.get(id)!).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  const affiliations = new Set(people.flatMap(person => (politics.people.get(person.id) ?? []).map(a => a.party.id)));
  const matched = people.filter(p => p.label.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  const safePage = Math.min(page, Math.max(0, Math.ceil(matched.length / 12) - 1));
  const referencePassages = passages.get(reference);
  return <section className="institution-crossings" aria-label="Croisements de parcours">
    <h3>{people.length} personnes · {affiliations.size} appartenances politiques documentées</h3>
    <p>Même {institution.type === 'school' ? 'établissement' : 'institution'}, parcours différents. Les couleurs portent sur toutes les appartenances sourcées, pas nécessairement sur celles au moment du passage. Aucun lien personnel n’est déduit.</p>
    {people.length > 1 && <label>Comparer les passages avec<select aria-label="Comparer les passages avec" value={referencePassages ? reference : ''} onChange={event => setReference(event.target.value)}><option value="">Choisir une personne</option>{people.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>}
    {people.length > 12 && <label>Retrouver un parcours<input value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Nom d’une personne…" /></label>}
    {matched.slice(safePage * 12, safePage * 12 + 12).map(person => <details key={person.id} className="crossing-person"><summary><strong>{person.label}</strong><PoliticalBadges affiliations={politics.people.get(person.id) ?? []} /><small>{[...new Set(passages.get(person.id)!.map(periodLabel))].join(' · ')}</small></summary>
      <div className="analysis-person-actions"><button className="secondary-button" onClick={() => onSelect(person.id)}>Suivre le parcours</button><button className="secondary-button" disabled={group.includes(person.id)} onClick={() => onGroup([...group, person.id])}>{group.includes(person.id) ? 'Dans le groupe' : 'Ajouter au groupe'}</button></div>
      {referencePassages && reference !== person.id && <><h4>Passages de {shortLabel(entities.get(reference)!)} et {shortLabel(person)}</h4><OverlapReceipt left={referencePassages} right={passages.get(person.id)!} /><details><summary>Sources du passage de {shortLabel(entities.get(reference)!)}</summary><PassageEvidence statements={referencePassages} data={data} /></details></>}
      <PassageEvidence statements={passages.get(person.id)!} data={data} /><PersonAffiliations person={person} politics={politics} data={data} />
    </details>)}
    {matched.length > 12 && <nav className="analysis-pagination" aria-label="Pages des parcours"><button disabled={!safePage} onClick={() => setPage(safePage - 1)}>Précédents</button><span>{safePage * 12 + 1}–{Math.min(matched.length, safePage * 12 + 12)} / {matched.length}</span><button disabled={(safePage + 1) * 12 >= matched.length} onClick={() => setPage(safePage + 1)}>Suivants</button></nav>}
    {!matched.length && <p>Aucun passage correspondant dans les filtres actifs.</p>}
  </section>;
}
