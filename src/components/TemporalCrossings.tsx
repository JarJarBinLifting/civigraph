'use client';

import { useMemo, useState } from 'react';
import { crossingPairs } from '@/lib/guided-networks';
import type { CommonConnection, GraphData } from '@/lib/types';
import { periodLabel } from '@/lib/presentation';
import { PassageEvidence } from './PassageEvidence';
import './GuidedNetworks.css';

const labels = { documented: 'Période commune documentée', possible: 'Chevauchement incertain', outside: 'Périodes distinctes', unknown: 'Dates insuffisantes' };
export function TemporalCrossings({ common, data }: { common: CommonConnection[]; data: GraphData }) {
  const [filter, setFilter] = useState('all'), [page, setPage] = useState(0);
  const pairs = useMemo(() => crossingPairs(common), [common]);
  const visible = pairs.filter(p => filter === 'all' || p.status === filter);
  const institutionCount = new Set(visible.map(p => p.entity.id)).size;
  const safePage = Math.min(page, Math.max(0, Math.ceil(visible.length / 12) - 1));
  return <section className="temporal-crossings" aria-label="Se sont-ils croisés ?">
    <h3>Se sont-ils croisés ?</h3>
    <p>Comparez chaque passage dans une même institution. Une période commune ne prouve pas une rencontre. Une école commune ne suffit pas à établir une même promotion.</p>
    <label>Filtrer les périodes<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="all">Tous les passages</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <p role="status">{visible.length} {visible.length === 1 ? 'paire de passages' : 'paires de passages'} · {institutionCount} {institutionCount === 1 ? 'institution' : 'institutions'}</p>
    {visible.slice(safePage * 12, safePage * 12 + 12).map(pair => <article className="crossing-card" key={pair.id}>
      <h4>{pair.entity.label}</h4><strong className={`crossing-status status-${pair.status}`}>{labels[pair.status]}</strong>
      {pair.sameCohort && <p>Même groupe attesté : {pair.left.cohort!.label}</p>}
      <div className="crossing-dates"><div><strong>{data.entities.find(e => e.id === pair.left.source)?.label}</strong><span>{periodLabel(pair.left)}</span></div><div><strong>{data.entities.find(e => e.id === pair.right.source)?.label}</strong><span>{periodLabel(pair.right)}</span></div></div>
      <details><summary>Vérifier les deux sources</summary><PassageEvidence data={data} statements={[pair.left, pair.right]} /></details>
    </article>)}
    {!visible.length && <p>Aucun passage trouvé avec ces filtres. Les informations disponibles peuvent être incomplètes.</p>}
    {visible.length > 12 && <nav className="guide-actions" aria-label="Pages des croisements"><button disabled={!safePage} onClick={() => setPage(safePage - 1)}>Précédents</button><span>{safePage + 1} / {Math.ceil(visible.length / 12)}</span><button disabled={(safePage + 1) * 12 >= visible.length} onClick={() => setPage(safePage + 1)}>Suivants</button></nav>}
  </section>;
}
