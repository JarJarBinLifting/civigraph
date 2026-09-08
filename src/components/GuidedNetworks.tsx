'use client';

import { useMemo, useRef, useState } from 'react';
import { cohortGroups, laterPassages, type CohortGroup } from '@/lib/guided-networks';
import { normalizeName } from '@/lib/graph-index';
import { createPresetView } from '@/lib/exploration-presets';
import { serializeView } from '@/lib/graph';
import { periodLabel } from '@/lib/presentation';
import type { GraphData, ViewState } from '@/lib/types';
import { PassageEvidence } from './PassageEvidence';
import { EntityAvatar } from './EntityAvatar';
import './NetworkInsights.css';
import './GuidedNetworks.css';

const steps = ['Qui compose ce groupe ?', 'Où les retrouve-t-on ensuite ?', 'Comparer deux parcours'];
export function GuidedNetworks({ data, view, onChange, onReveal, onOpenView }: { onOpenView: (view: ViewState) => void; data: GraphData; view: ViewState; onChange: (patch: Partial<ViewState>) => void; onReveal: (id: string) => void }) {
  const groups = useMemo(() => cohortGroups(data), [data]);
  const [kind, setKind] = useState('all'), [query, setQuery] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const catalogueHeading = useRef<HTMLHeadingElement>(null);
  const group = groups.find(g => g.id === view.journey);
  const step = Math.max(0, Math.min(2, view.journeyStep ?? 0));
  const shown = groups.filter(g => (kind === 'all' || g.kind === kind) && normalizeName(`${g.label} ${g.institution.label} ${g.members.map(m => m.person.label).join(' ')}`).includes(normalizeName(query)));
  function advance(journeyStep: number) { onChange({ journeyStep }); setCopyMessage(''); requestAnimationFrame(() => heading.current?.focus()); }
  return <section className="network-insights guided-networks" aria-label="Explorations guidées">
    <header className="insights-heading"><span className="eyebrow">Comprendre les réseaux politiques</span><h2 ref={catalogueHeading} tabIndex={-1}>Équipes, promotions et parcours communs</h2><p>Partez d’un groupe attesté, suivez ses membres, puis comparez leurs passages. Trois étapes pour lire les liens et vérifier les preuves.</p></header>
    {!group ? <>
      <div className="insights-filters"><label>Quel groupe explorer ?<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Une promotion, un ministre, une personne…" /></label><label>Type de groupe<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">Tous les groupes</option><option value="cabinet">Cabinets ministériels</option><option value="promotion">Promotions et programmes</option></select></label></div>
      <p className="insights-scope">{groups.filter(g => g.kind === 'cabinet').length} repères de cabinets et {groups.filter(g => g.kind === 'promotion').length} promotions ou programmes. Les sélections sont partielles ; elles ne désignent pas nécessairement la première équipe d’une carrière.</p>
      <div className="guide-catalogue">{shown.map(g => <button className="insight-card" key={g.id} onClick={() => { onChange({ journey: g.id, journeyStep: 0 }); setCopyMessage(''); requestAnimationFrame(() => heading.current?.focus()); }}><span className="eyebrow">{g.kind === 'cabinet' ? 'Cabinet ministériel' : 'Promotion / programme'}</span><strong>{g.label}</strong><span>{g.members.length} {g.members.length === 1 ? 'personne documentée' : 'personnes documentées'}</span><span className="insight-action">Explorer en trois étapes →</span></button>)}</div>
      {!shown.length && <p>Aucun groupe ne correspond à cette recherche dans la sélection.</p>}
    </> : <>
      <button className="return-global-map" onClick={() => { onChange({ journey: undefined, journeyStep: undefined }); requestAnimationFrame(() => catalogueHeading.current?.focus()); }}>← Choisir un autre groupe</button>
      <h3>{group.label}</h3><p className="insights-scope">{group.members.length} {group.members.length === 1 ? 'membre documenté' : 'membres documentés'} dans cette sélection.</p><details className="guide-coverage"><summary>Couverture de ce groupe</summary><p>{group.members[0].relations[0].evidence?.note}</p></details>
      <nav className="guide-steps" aria-label="Étapes de l’exploration">{steps.map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} onClick={() => advance(i)}><span>{i + 1}</span>{label}</button>)}</nav>
      <h3 ref={heading} tabIndex={-1}>{steps[step]}</h3>
      {step === 0 && <div className="guide-roster">{group.members.map(member => <article className="crossing-card" key={member.person.id}><div className="guide-person"><EntityAvatar entity={member.person} /><h4>{member.person.label}</h4></div><p>{member.relations.map(r => r.role).filter(Boolean).join(' · ')}</p><p>{member.relations.map(periodLabel).join(' · ')}</p><details><summary>Lire la preuve d’appartenance</summary><PassageEvidence data={data} statements={member.relations} /></details><button onClick={() => onReveal(member.person.id)}>Explorer son réseau</button></article>)}</div>}
      {step === 1 && <><p>Passages dont le début ou la date d’attestation est strictement postérieur au repère du groupe. Les dates inconnues et les activités déjà commencées ne figurent pas ici. Ces étapes ne décrivent pas nécessairement un poste actuel.</p><div className="guide-roster">{group.members.map(member => {
        const later = laterPassages(data, member.person.id, group);
        return <article className="crossing-card" key={member.person.id}><h4>{member.person.label}</h4><p>{later.length ? `${later.length} passages ultérieurs documentés` : 'Aucun passage ultérieur daté dans le corpus.'}</p>{later.length > 0 && <details><summary>Suivre les étapes et leurs sources</summary><PassageEvidence data={data} statements={later} /></details>}<button onClick={() => onReveal(member.person.id)}>Voir le parcours complet</button></article>;
      })}</div></>}
      {step === 2 && <GroupComparison onOpenView={onOpenView} key={group.id} group={group} data={data} />}
      <div className="guide-actions"><button disabled={step === 0} onClick={() => advance(step - 1)}>Étape précédente</button>{step < 2 && <button className="primary-button" onClick={() => advance(step + 1)}>Étape suivante →</button>}<button onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}${serializeView(view)}`); setCopyMessage('Lien copié : groupe et étape conservés.'); } catch { setCopyMessage('Copie indisponible. Copiez l’adresse de la page pour partager cette étape.'); } }}>Partager cette étape</button></div><p role="status">{copyMessage}</p>
    </>}
  </section>;
}

function GroupComparison({ group, data, onOpenView }: { onOpenView: (view: ViewState) => void; group: CohortGroup; data: GraphData }) {
  const [left, setLeft] = useState(group.members[0].person.id), [right, setRight] = useState(group.members[1]?.person.id ?? '');
  const preset = left !== right ? createPresetView(data, 'comparison', left, right) : null;
  return <div className="guide-comparison"><p>Retrouvez les institutions communes et distinguez les périodes partagées, incertaines ou différentes. Les filtres de la carte sont réinitialisés pour explorer les deux carrières.</p>{group.members.length < 2 ? <p>Un seul membre est documenté dans cette promotion : la comparaison demande un second parcours sourcé.</p> : <><div className="insights-filters"><label>Premier parcours<select value={left} onChange={e => setLeft(e.target.value)}>{group.members.map(m => <option key={m.person.id} value={m.person.id}>{m.person.label}</option>)}</select></label><label>Second parcours<select value={right} onChange={e => setRight(e.target.value)}>{group.members.map(m => <option key={m.person.id} value={m.person.id}>{m.person.label}</option>)}</select></label></div>{preset ? <a className="primary-button" onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); onOpenView({ ...preset, comparisonMode: 'crossings', journey: group.id, journeyStep: 2 }); } }} href={serializeView({ ...preset, comparisonMode: 'crossings', journey: group.id, journeyStep: 2 })}>Se sont-ils croisés ? →</a> : <p role="status">Choisissez deux personnes différentes.</p>}</>}</div>;
}
