'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Grid2X2, Network, X } from 'lucide-react';
import { sharedInstitutions, type InstitutionParticipation } from '@/lib/system-analysis';
import type { GraphData, ViewState } from '@/lib/types';
import { shortLabel, categoryInfo, periodLabel } from '@/lib/presentation';
import { EntitySearch } from './EntitySearch';
import { AnalysisGraph } from './AnalysisGraph';
import { OverlapReceipt, PassageEvidence } from './PassageEvidence';

const emptyGroup: string[] = [];

export function CommonInstitutions({ data, records, view, onChange, onSelect }: {
  data: GraphData; records: InstitutionParticipation[]; view: ViewState; onChange: (patch: Partial<ViewState>) => void; onSelect: (id: string) => void;
}) {
  const ids = view.group ?? emptyGroup, threshold = view.commonThreshold ?? 'two';
  const people = data.entities.filter(e => ids.includes(e.id) && e.type === 'person').sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  const common = useMemo(() => sharedInstitutions(records, ids, threshold), [records, ids, threshold]);
  const [page, setPage] = useState(0), [personEvidence, setPersonEvidence] = useState<string>();
  const safePage = Math.min(page, Math.max(0, Math.ceil(common.length / 6) - 1));
  const shown = common.slice(safePage * 6, safePage * 6 + 6);
  const evidencePanel = useRef<HTMLElement>(null);
  const displayMatrix = view.commonDisplay === 'matrix' || people.length > 8;
  useEffect(() => { if (view.institution) evidencePanel.current?.scrollIntoView({ block: 'nearest' }); }, [view.institution, personEvidence]);
  const active = common.find(r => r.entity.id === view.institution);
  const nodes = useMemo(() => [...people.map(entity => ({ entity, column: 0 })), ...shown.map(r => ({ entity: r.entity, column: 1 }))], [people, shown]);
  const edges = useMemo(() => shown.flatMap(record => [...record.people.keys()].map(person => ({ id: `${person}:${record.entity.id}`, source: person, target: record.entity.id, count: 1 }))), [shown]);
  function inspect(id: string, person?: string) { setPersonEvidence(person); onChange({ institution: id, bridge: undefined }); }
  const evidenceEntries = active ? [...active.people].filter(([person]) => !personEvidence || person === personEvidence) : [];
  return <section className="common-institutions" aria-label="Points communs du groupe">
    <div className="analysis-section-heading"><div><h2>Quelles institutions partagent-ils ?</h2><p>Ajoutez des personnes, puis explorez leurs passages documentés.</p></div></div>
    <EntitySearch data={data} peopleOnly label="Ajouter une personne au groupe" placeholder="Ajouter une personne…" onSelect={entity => { if (!ids.includes(entity.id)) onChange({ group: [...ids, entity.id] }); }} />
    <details className="group-editor" open={people.length <= 8}><summary>Groupe de {people.length} personnes</summary><div className="group-chips" aria-label="Personnes du groupe">{people.map(person => <button key={person.id} aria-label={`Retirer ${person.label} du groupe`} onClick={() => onChange({ group: ids.filter(id => id !== person.id) })}>{shortLabel(person)}<X size={14} /></button>)}{ids.length > 0 && <button onClick={() => onChange({ group: [], institution: undefined })}>Vider le groupe</button>}</div></details>
    {people.length < 2 ? <p className="analysis-empty">Sélectionnez au moins deux personnes pour révéler leurs institutions communes.</p> : <>
      <div className="analysis-options"><div className="view-toggle" role="group" aria-label="Seuil de partage"><button aria-pressed={threshold === 'two'} onClick={() => { setPage(0); onChange({ commonThreshold: 'two' }); }}>À au moins deux</button><button aria-pressed={threshold === 'all'} onClick={() => { setPage(0); onChange({ commonThreshold: 'all' }); }}>À tout le groupe</button></div><div className="view-toggle" role="group" aria-label="Lecture des points communs"><button disabled={people.length > 8} aria-pressed={!displayMatrix} onClick={() => onChange({ commonDisplay: 'map' })}><Network size={16} />Carte</button><button aria-pressed={displayMatrix} onClick={() => onChange({ commonDisplay: 'matrix' })}><Grid2X2 size={16} />Matrice</button></div></div>
      {people.length > 8 && <p className="section-caption">Au-delà de huit personnes, la matrice garde tous les parcours lisibles.</p>}<p role="status" className="analysis-receipt"><strong>{common.length} institutions communes</strong> · {people.length} personnes sélectionnées · selon les filtres actifs</p>
      {common.length === 0 ? <p className="analysis-empty">Aucune institution commune selon ces critères. Ajustez le groupe ou les filtres. L’absence de résultat ne prouve pas l’absence de lien.</p> : <>
        <p className="section-caption">{safePage * 6 + 1}–{Math.min(common.length, safePage * 6 + 6)} sur {common.length} institutions. Cliquez sur une institution ou une case pour consulter ses sources.</p>
        {displayMatrix ? <div className="matrix-scroll" tabIndex={0} role="region" aria-label="Matrice personnes et institutions"><table className="common-matrix"><caption>Passages documentés par personne et institution. Une case vide signifie aucun passage dans les filtres actuels.</caption><thead><tr><th scope="col">Personne</th>{shown.map(record => <th scope="col" key={record.entity.id}><button onClick={() => inspect(record.entity.id)}>{shortLabel(record.entity)}</button></th>)}</tr></thead><tbody>{people.map(person => <tr key={person.id}><th scope="row"><button onClick={() => onSelect(person.id)}>{shortLabel(person)}</button></th>{shown.map(record => <td key={record.entity.id}>{record.people.has(person.id) ? <button className="matrix-cell" aria-label={`Sources de ${person.label} à ${record.entity.label}`} onClick={() => inspect(record.entity.id, person.id)}><Check size={18} /><span>{record.people.get(person.id)!.length} déclaration{record.people.get(person.id)!.length > 1 ? 's' : ''}</span></button> : <span aria-label="Aucun passage documenté">—</span>}</td>)}</tr>)}</tbody></table></div> : <AnalysisGraph nodes={nodes} edges={edges} columns selected={active?.entity.id} onSelect={id => people.some(p => p.id === id) ? onSelect(id) : inspect(id)} onEdge={id => { const edge = edges.find(e => e.id === id); if (edge) inspect(edge.target, edge.source); }} />}
        <div className="common-records">{shown.map(record => <button className="common-record" key={record.entity.id} aria-pressed={active?.entity.id === record.entity.id} onClick={() => inspect(record.entity.id)}><strong>{shortLabel(record.entity)}</strong><span>{record.people.size}/{people.length} personnes</span><small>{[...new Set([...record.people.values()].flat().map(r => categoryInfo[r.category].singular))].join(' · ')}</small></button>)}</div>
        {common.length > 6 && <nav className="analysis-pagination" aria-label="Pages des institutions communes"><button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Précédentes</button><span>{safePage + 1} / {Math.ceil(common.length / 6)}</span><button disabled={(safePage + 1) * 6 >= common.length} onClick={() => setPage(safePage + 1)}>Suivantes</button></nav>}
      </>}
      {active && <section ref={evidencePanel} className="analysis-evidence" aria-label="Sources des points communs"><h3>{shortLabel(active.entity)} · passages du groupe</h3>{personEvidence && <button className="subtle-link" onClick={() => setPersonEvidence(undefined)}>Voir tous les passages du groupe</button>}<p className="section-caption">Un passage partagé ne prouve pas une rencontre. Les périodes restent attachées à chaque déclaration.</p>
        {evidenceEntries.map(([id, statements]) => <details key={id} className="analysis-person-evidence" open={Boolean(personEvidence)}><summary>{shortLabel(data.entities.find(e => e.id === id)!)}<small>{[...new Set(statements.map(periodLabel))].join(' · ')}</small></summary><PassageEvidence statements={statements} data={data} /></details>)}
        {!personEvidence && <details><summary>Comparer les périodes deux à deux</summary>{[...active.people].flatMap(([left, a], i) => [...active.people].slice(i + 1).map(([right, b]) => <div key={`${left}:${right}`}><strong>{shortLabel(data.entities.find(e => e.id === left)!)} / {shortLabel(data.entities.find(e => e.id === right)!)}</strong><OverlapReceipt left={a} right={b} /></div>))}</details>}
      </section>}
    </>}
  </section>;
}
