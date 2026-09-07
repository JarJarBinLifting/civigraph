'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import type { GraphData, ViewState } from '@/lib/types';
import { institutionBridges, type InstitutionParticipation } from '@/lib/system-analysis';
import { normalizeName } from '@/lib/graph-index';
import { shortLabel, typeInfo } from '@/lib/presentation';
import { AnalysisGraph } from './AnalysisGraph';
import { OverlapReceipt, PassageEvidence } from './PassageEvidence';

export function InstitutionOverview({ data, records, view, onChange, onSelect }: {
  data: GraphData; records: InstitutionParticipation[]; view: ViewState; onChange: (patch: Partial<ViewState>) => void; onSelect: (id: string) => void;
}) {
  const heading = useRef<HTMLDivElement>(null);
  useEffect(() => { if (view.institution) heading.current?.scrollIntoView({ block: 'nearest' }); }, [view.institution, view.bridge]);
  const bridges = useMemo(() => institutionBridges(records), [records]);
  const [query, setQuery] = useState(''), [page, setPage] = useState(0), [minimum, setMinimum] = useState(2);
  const byId = useMemo(() => new Map(records.map(r => [r.entity.id, r])), [records]);
  const institution = byId.get(view.institution ?? ''), target = institution ? byId.get(view.bridge ?? '') : undefined;
  const neighbors = institution ? bridges.filter(b => (b.source === institution.entity.id || b.target === institution.entity.id) && b.people.length >= minimum) : [];
  const partnerIds = new Set(neighbors.map(b => b.source === institution?.entity.id ? b.target : b.source));
  const matched = records.filter(record => (!institution || partnerIds.has(record.entity.id)) && normalizeName(`${record.entity.label} ${record.entity.abbreviatedLabel ?? ''}`).includes(normalizeName(query)));
  const pageSize = institution ? 11 : 12;
  const safePage = Math.min(page, Math.max(0, Math.ceil(matched.length / pageSize) - 1));
  const shown = matched.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const mapRecords = institution ? [institution, ...shown] : shown;
  const visibleIds = new Set(mapRecords.map(record => record.entity.id));
  const nodes = mapRecords.map(record => ({ entity: record.entity, count: record.people.size }));
  const mapEdges = bridges.filter(b => visibleIds.has(b.source) && visibleIds.has(b.target) && b.people.length >= minimum && (!institution || b.source === institution.entity.id || b.target === institution.entity.id)).map(b => ({ ...b, count: b.people.length }));
  const selectedBridge = institution && target ? bridges.find(b => (b.source === institution.entity.id && b.target === target.entity.id) || (b.target === institution.entity.id && b.source === target.entity.id)) : undefined;
  function openInstitution(id: string) { setPage(0); setQuery(''); onChange({ institution: id, bridge: undefined, selected: id, edge: null }); }
  function openBridge(id: string) { const bridge = bridges.find(b => b.id === id); if (bridge) onChange({ institution: institution?.entity.id ?? bridge.source, bridge: institution ? bridge.source === institution.entity.id ? bridge.target : bridge.source : bridge.target }); }
  const personIds = selectedBridge?.people ?? (institution ? [...institution.people.keys()] : []);
  const people = data.entities.filter(e => personIds.includes(e.id)).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  return <section className="institution-overview" aria-label="Lecture du système par institutions">
    <nav className="analysis-trail" hidden={!institution} aria-label="Niveaux de lecture"><button onClick={() => { setPage(0); setQuery(''); onChange({ institution: undefined, bridge: undefined }); }} aria-current={!institution ? 'step' : undefined}>Institutions</button>{institution && <><ArrowRight size={14} /><button aria-current={!target ? 'step' : undefined} onClick={() => onChange({ bridge: undefined })}>{shortLabel(institution.entity)}</button></>}{target && <><ArrowRight size={14} /><span>Personnes partagées avec {shortLabel(target.entity)}</span></>}</nav>
    <div ref={heading} className="analysis-section-heading"><div><h2>{institution ? target ? 'Les personnes qui relient ces institutions' : shortLabel(institution.entity) : 'Explorer les institutions'}</h2><p>{institution ? `${institution.people.size} personnes avec un passage documenté dans les filtres actuels.` : ''}</p></div>{institution && <button className="secondary-button" onClick={() => onSelect(institution.entity.id)}>Ouvrir la fiche</button>}</div>
    {view.institution && !institution && <p className="analysis-empty">L’institution sélectionnée n’a aucun passage dans ces filtres. Ajustez les catégories ou la période.</p>}
    {target ? <>
      <button className="secondary-button" onClick={() => onChange({ bridge: undefined })}><ArrowLeft size={15} />Revenir aux institutions liées</button>
      <p className="analysis-receipt" role="status"><strong>{selectedBridge?.people.length ?? 0} personnes distinctes</strong> · {shortLabel(institution!.entity)} et {shortLabel(target.entity)}</p>
      <p className="section-caption">Ce nombre indique des passages dans les deux institutions, quelle que soit leur simultanéité. Chaque personne permet de vérifier les dates et les sources.</p>
      {people.length > 1 && <button className="secondary-button" onClick={() => onChange({ group: people.map(e => e.id), systemLens: 'common', institution: undefined, bridge: undefined })}><Users size={16} />Comparer ce groupe</button>}
    </> : <>
      <div className="institution-search"><label>Retrouver une institution<input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder={institution ? 'Parmi les institutions liées…' : 'Nom d’une institution…'} /></label><label>Personnes partagées, au minimum<select value={minimum} onChange={e => { setMinimum(Number(e.target.value)); setPage(0); }}><option value={1}>1 personne</option><option value={2}>2 personnes</option><option value={5}>5 personnes</option><option value={10}>10 personnes</option></select></label></div>
      <p className="analysis-receipt" role="status"><strong>{matched.length} institutions{institution ? ' liées' : ''}</strong> · {mapRecords.length} affichées sur cette page · {mapEdges.length} connexions entre elles</p>
      <details className="analysis-help"><summary>Comment lire les connexions ?</summary><p>Taille et classement : personnes distinctes documentées. Épaisseur et nombre sur un lien : personnes partagées. Survolez une institution pour suivre ses connexions, cliquez sur un lien pour voir les personnes.</p></details>
      {mapRecords.length > 0 && <AnalysisGraph nodes={nodes} edges={mapEdges} selected={institution?.entity.id} onSelect={openInstitution} onEdge={openBridge} />}
      <div className="institution-index" aria-label="Institutions disponibles">{shown.map(record => {
        const connection = institution ? neighbors.find(b => b.source === record.entity.id || b.target === record.entity.id) : undefined;
        return <div className="institution-row" key={record.entity.id}><button onClick={() => openInstitution(record.entity.id)}><i style={{ background: typeInfo[record.entity.type].color }} /><span><strong>{shortLabel(record.entity)}</strong><small>{typeInfo[record.entity.type].label} · {record.people.size} personnes</small></span></button>{connection && <button className="bridge-button" aria-label={`${connection.people.length} personnes partagées avec ${shortLabel(record.entity)}`} onClick={() => openBridge(connection.id)}>{connection.people.length} personnes partagées<ArrowRight size={15} /></button>}</div>;
      })}</div>
      {matched.length === 0 && <p className="analysis-empty">Aucune institution ne correspond. Ajustez la recherche, le seuil ou les filtres.</p>}
      {matched.length > pageSize && <nav className="analysis-pagination" aria-label="Pages des institutions"><button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Précédentes</button><span>Page {safePage + 1} / {Math.ceil(matched.length / pageSize)}</span><button disabled={(safePage + 1) * pageSize >= matched.length} onClick={() => setPage(safePage + 1)}>Suivantes</button></nav>}
    </>}
    {institution && <details className="institution-people" open={Boolean(target)}><summary>{target ? 'Passages et sources des personnes partagées' : `Voir les ${people.length} personnes et leurs passages`}</summary><p className="section-caption">Ouvrez une personne pour consulter toutes ses déclarations sur ces institutions.</p>{people.map(person => <details key={person.id} className="analysis-person-evidence"><summary>{shortLabel(person)}<small>{institution.people.get(person.id)?.length ?? 0}{target ? ` + ${target.people.get(person.id)?.length ?? 0}` : ''} déclarations</small></summary><div className="analysis-person-actions"><button className="secondary-button" onClick={() => onSelect(person.id)}>Ouvrir la fiche</button><button className="secondary-button" disabled={view.group?.includes(person.id)} onClick={() => onChange({ group: [...(view.group ?? []), person.id] })}>{view.group?.includes(person.id) ? 'Dans le groupe' : 'Ajouter au groupe'}</button></div>{target && <OverlapReceipt left={institution.people.get(person.id) ?? []} right={target.people.get(person.id) ?? []} />}<h4>{shortLabel(institution.entity)}</h4><PassageEvidence statements={institution.people.get(person.id) ?? []} data={data} />{target && <><h4>{shortLabel(target.entity)}</h4><PassageEvidence statements={target.people.get(person.id) ?? []} data={data} /></>}</details>)}</details>}
    <p className="analysis-limit">Institutions identifiées dans ce corpus limité ; les simples intitulés de fonction sont exclus. La disposition ne mesure ni influence ni proximité personnelle.</p>
  </section>;
}
