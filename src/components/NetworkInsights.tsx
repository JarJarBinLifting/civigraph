'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Network, Users } from 'lucide-react';
import { crossPartyCircles, MILIEUS, personMilieus, type CrossPartyCircle, type MilieuProfile } from '@/lib/network-insights';
import { normalizeName } from '@/lib/graph-index';
import { periodLabel } from '@/lib/presentation';
import type { GraphData, Relation, ViewState } from '@/lib/types';
import { AnalysisGraph } from './AnalysisGraph';
import { PassageEvidence } from './PassageEvidence';
import './NetworkInsights.css';

export function NetworkInsights({ data, relations, view, onChange, onReveal }: {
  data: GraphData; relations: Relation[]; view: ViewState;
  onChange: (patch: Partial<ViewState>) => void; onReveal: (id: string) => void;
}) {
  const isCircles = view.systemLens === 'circles';
  const [query, setQuery] = useState(''), [page, setPage] = useState(0), [milieu, setMilieu] = useState('');
  const contemporary = view.circleTiming === 'contemporary';
  const detail = useRef<HTMLDivElement>(null);
  function inspect(patch: Partial<ViewState>) {
    onChange(patch);
    requestAnimationFrame(() => { detail.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); detail.current?.focus({ preventScroll: true }); });
  }
  const circles = useMemo(() => isCircles ? crossPartyCircles(data, relations, contemporary) : [], [data, relations, contemporary, isCircles]);
  const profiles = useMemo(() => isCircles ? [] : personMilieus(data, relations).filter(p => p.milieus.length >= 2), [data, relations, isCircles]);
  const matchedCircles = circles.filter(c => normalizeName(c.entity.label).includes(normalizeName(query)));
  const matchedProfiles = profiles.filter(p => normalizeName(p.person.label).includes(normalizeName(query)) && (!milieu || p.milieus.some(m => m.id === milieu)));
  const count = isCircles ? matchedCircles.length : matchedProfiles.length;
  const safePage = Math.min(page, Math.max(0, Math.ceil(count / 8) - 1));
  const circle = matchedCircles.find(c => c.entity.id === view.institution);
  const profile = matchedProfiles.find(p => p.person.id === view.selected);
  return <section className="network-insights" aria-label={isCircles ? 'Cercles entre partis' : 'Parcours entre milieux'}>
    <header className="insights-heading"><span className="eyebrow">Écoles, associations, carrières</span><h2>{isCircles ? 'Quels cercles partagent-ils ?' : 'Qui est passé par plusieurs milieux ?'}</h2>
      <p>{isCircles ? 'Retrouvez les écoles, commissions et associations communes à des personnes de partis différents.' : 'De l’administration aux entreprises, des cabinets aux médias : suivez les étapes de leurs carrières.'}</p>
    </header>
    <div className="insights-switch" role="group" aria-label="Explorer les réseaux"><button aria-pressed={isCircles} onClick={() => onChange({ systemLens: 'circles' })}><Users size={17} />Cercles entre partis</button><button aria-pressed={!isCircles} onClick={() => onChange({ systemLens: 'milieus' })}><Network size={17} />Parcours entre milieux</button></div>
    <p className="insights-scope">Passages selon les filtres de la carte. {isCircles ? 'Les partis sont recherchés dans l’ensemble des parcours. Des partis distincts ne signifient pas nécessairement des camps opposés.' : 'Classement par nombre de milieux documentés, sans score d’influence. La classification des organisations est partielle.'}</p>
    <div className="insights-filters"><label>{isCircles ? 'Rechercher un cercle' : 'Rechercher une personne'}<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder={isCircles ? 'Une école, une commission…' : 'Un nom…'} /></label>
      {isCircles ? <label>Appartenances politiques<select value={view.circleTiming ?? 'all'} onChange={e => { onChange({ circleTiming: e.target.value as ViewState['circleTiming'] }); setPage(0); }}><option value="all">Au cours des carrières</option><option value="contemporary">Au même moment, dates établies</option></select></label> : <label>Passage dans un milieu<select value={milieu} onChange={e => { setMilieu(e.target.value); setPage(0); }}><option value="">Tous les milieux</option>{MILIEUS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>}
    </div>
    <p className="insights-count" role="status">{count} {isCircles ? 'cercles' : 'personnes avec au moins deux milieux'} avec ces filtres</p>
    {isCircles && <p className="insights-scope">{contemporary ? 'Une période commune doit être établie pour les deux passages et les deux appartenances politiques. Les dates incomplètes peuvent exclure des résultats.' : 'Les passages et les appartenances peuvent dater d’époques différentes. Ouvrez un rapprochement pour comparer les quatre sources.'}</p>}
    <div className="insights-layout"><div className="insights-results">
      {isCircles ? matchedCircles.slice(safePage * 8, safePage * 8 + 8).map(c => <button key={c.entity.id} className="insight-card" aria-pressed={circle?.entity.id === c.entity.id} onClick={() => inspect({ institution: c.entity.id, edge: null })}><strong>{c.entity.label}</strong><span>{c.people.length} personnes · {c.partyIds.length} partis</span><small>{c.pairs.filter(p => p.contemporary).length} paires avec une période commune établie</small><span className="insight-action">Voir les rapprochements →</span></button>) : matchedProfiles.slice(safePage * 8, safePage * 8 + 8).map(p => <button key={p.person.id} className="insight-card" aria-pressed={profile?.person.id === p.person.id} onClick={() => inspect({ selected: p.person.id, edge: null })}><strong>{p.person.label}</strong><span>{p.milieus.length} milieux documentés</span><small>{p.milieus.map(m => m.label).join(' · ')}</small><span className="insight-action">Suivre les passages →</span></button>)}
      {!count && <p className="insights-empty">Aucun résultat avec cette recherche et ces filtres. Cela ne prouve pas l’absence de liens.</p>}
      {count > 8 && <nav className="analysis-pagination" aria-label="Pages des résultats"><button disabled={!safePage} onClick={() => setPage(safePage - 1)}>Précédents</button><span>{safePage + 1} / {Math.ceil(count / 8)}</span><button disabled={(safePage + 1) * 8 >= count} onClick={() => setPage(safePage + 1)}>Suivants</button></nav>}
    </div><div ref={detail} tabIndex={-1} className="insights-detail" aria-live="polite">
      {isCircles ? circle ? <CircleDetails key={`${circle.entity.id}:${contemporary}`} circle={circle} data={data} onReveal={onReveal} /> : <p className="insights-empty">Choisissez un cercle pour voir qui le partage, les partis déclarés et les dates de chaque passage.</p> : profile ? <><h3>{profile.person.label}</h3><button className="secondary-button" onClick={() => onReveal(profile.person.id)}>Voir sur la carte<ArrowUpRight size={15} /></button><MilieuEvidence profile={profile} data={data} /></> : <p className="insights-empty">Choisissez une personne pour suivre ses passages d’un milieu à l’autre.</p>}
    </div></div>
    <details className="insights-method"><summary>Comment sont construits ces rapprochements ?</summary><p>Un cercle réunit au moins deux personnes distinctes avec des déclarations d’appartenance à des partis différents. Les groupes parlementaires et le statut « indépendant » ne sont pas comptés comme des partis. Les successions de partis restent visibles sous leurs noms documentés.</p><p>Chaque milieu correspond à des institutions ou fonctions classées explicitement, ou à des relations de formation et de parti. Une formation ne vaut pas emploi dans l’administration. Les sources peuvent être des déclarations Wikidata à recouper, des déclarations d’intérêts ou des compositions publiées. Aucun lien personnel, rencontre ou influence n’est déduit.</p></details>
  </section>;
}

function CircleDetails({ circle, data, onReveal }: { circle: CrossPartyCircle; data: GraphData; onReveal: (id: string) => void }) {
  const [pairIndex, setPairIndex] = useState(0);
  const index = Math.min(pairIndex, circle.pairs.length - 1), pair = circle.pairs[index];
  const entities = useMemo(() => new Map(data.entities.map(e => [e.id, e])), [data]);
  const nodes = useMemo(() => [...new Set(pair.proofs.flatMap(r => [r.source, r.target]))].map(id => ({ entity: entities.get(id)! })), [pair, entities]);
  const edges = useMemo(() => pair.proofs.map(r => ({ id: r.id, source: r.source, target: r.target, count: 1 })), [pair]);
  return <article className="circle-detail"><h3>{circle.entity.label}</h3><button className="secondary-button" onClick={() => onReveal(circle.entity.id)}>Voir sur la carte<ArrowUpRight size={15} /></button>
    <nav className="analysis-pagination" aria-label="Rapprochements du cercle"><button disabled={!index} onClick={() => setPairIndex(index - 1)}>Précédent</button><span>Paire {index + 1} / {circle.pairs.length}</span><button disabled={index + 1 >= circle.pairs.length} onClick={() => setPairIndex(index + 1)}>Suivant</button></nav>
    <h4>{entities.get(pair.left)!.label} et {entities.get(pair.right)!.label}</h4>
    <p className={`crossing-verdict ${pair.contemporary ? 'is-established' : ''}`}>{pair.contemporary ? 'Passages et partis différents : une période commune est établie.' : 'Partis différents au cours des carrières ; leur contemporanéité dans ce cercle n’est pas établie.'}</p>
    <AnalysisGraph nodes={nodes} edges={edges} onSelect={onReveal} evidence />
    <p className="insights-scope">Les traits représentent les quatre faits ci-dessous. Ils ne représentent pas des relations personnelles.</p>
    {[pair.left, pair.right].map(id => <section className="crossing-proof" key={id}><button className="insight-person" onClick={() => onReveal(id)}>{entities.get(id)!.label}<ArrowUpRight size={14} /></button>{pair.proofs.filter(r => r.source === id).map(r => <details key={r.id}><summary><strong>{entities.get(r.target)!.label}</strong><span>{r.category === 'party' ? 'Appartenance politique' : r.role ?? r.label} · {periodLabel(r)}</span></summary><PassageEvidence statements={[r]} data={data} /></details>)}</section>)}
    <details><summary>Tous les passages documentés de ces deux personnes</summary><PassageEvidence statements={circle.people.filter(p => p.person.id === pair.left || p.person.id === pair.right).flatMap(p => [...p.passages, ...p.affiliations])} data={data} /></details>
  </article>;
}

export function MilieuEvidence({ profile, data }: { profile: MilieuProfile; data: GraphData }) {
  return <div className="milieu-evidence"><p>Cette personne apparaît dans {profile.milieus.length} milieux documentés. Les passages peuvent être successifs ou simultanés.</p>{profile.milieus.map(m => <details key={m.id}><summary><strong>{m.label}</strong><span>{m.passages.map(p => p.entity.label).join(' · ')}</span></summary>{m.passages.map(p => <section key={p.entity.id}><h4>{p.entity.label}</h4><PassageEvidence statements={p.statements} data={data} /></section>)}</details>)}{profile.unclassified > 0 && <p className="insights-scope">{profile.unclassified} autres entités du parcours restent hors de cette classification. Ce décompte ne mesure pas l’influence.</p>}</div>;
}
