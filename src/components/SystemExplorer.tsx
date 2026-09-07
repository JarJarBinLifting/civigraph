'use client';

import { useMemo, type ReactNode } from 'react';
import type { Entity, GraphData, ViewState } from '@/lib/types';
import type { SystemGraph } from '@/lib/system-graph';
import { institutionParticipation } from '@/lib/system-analysis';
import { periodLabel } from '@/lib/presentation';
import { getPeriodContext } from '@/lib/graph';
import { supportsPeriods } from '@/lib/temporal';
import { SYSTEMS, SYSTEM_SCOPE, type PoliticalIndex } from '@/lib/system-reading';
import { InstitutionOverview } from './InstitutionOverview';
import { CommonInstitutions } from './CommonInstitutions';
import { PoliticalLegend } from './PoliticalLegend';

export function SystemExplorer({ data, graph, politics, view, selected, onChange, onSelect, children }: {
  data: GraphData; graph: SystemGraph; view: ViewState; selected?: Entity;
  politics: PoliticalIndex;
  onChange: (patch: Partial<ViewState>) => void; onSelect: (id: string) => void; children: ReactNode;
}) {
  const lens = view.systemLens ?? 'entities';
  const records = useMemo(() => institutionParticipation(graph), [graph]);
  const anchor = data.relations.find(r => r.id === view.period);
  const periodEntity = (selected && supportsPeriods(selected) ? selected : undefined) ?? data.entities.find(e => e.id === view.institution);
  const periodContext = useMemo(() => periodEntity ? getPeriodContext(data, { ...view, focus: periodEntity.id, expanded: [periodEntity.id] }) : undefined, [data, view, periodEntity]);
  const options = periodContext?.options ?? [];
  const periodOptions = anchor && !options.some(r => r.id === anchor.id) ? [anchor, ...options] : options;
  return <div className={`system-explorer lens-${lens}`}>
    <div className="system-reading-toolbar">
      <div className="system-organizers" role="group" aria-label="Système organisant la carte">{SYSTEMS.map(system => <button key={system.id} title={SYSTEM_SCOPE[system.id]} aria-pressed={(view.system ?? 'all') === system.id} disabled={system.id !== 'all' && !data.relations.some(r => r.category === system.id)} onClick={() => onChange({ system: system.id, edge: null })}>{system.label}</button>)}</div>
      <div className="system-tools-row"><div className="view-toggle" role="group" aria-label="Lecture de la carte"><button aria-pressed={lens === 'entities' && (view.reading ?? 'groups') === 'groups'} onClick={() => onChange({ systemLens: 'entities', reading: 'groups' })}>Groupes</button><button aria-pressed={lens === 'entities' && view.reading === 'individuals'} onClick={() => onChange({ systemLens: 'entities', reading: 'individuals' })}>Individus</button></div><div className="system-complementary-tools"><button aria-pressed={lens === 'common'} onClick={() => onChange({ systemLens: lens === 'common' ? 'entities' : 'common' })}>Points communs{view.group?.length ? ` (${view.group.length})` : ''}</button><button aria-pressed={lens === 'institutions'} onClick={() => onChange({ systemLens: lens === 'institutions' ? 'entities' : 'institutions' })}>Index des institutions</button></div></div>
      <div className="system-time-row">{periodOptions.length > 0 && <label>Période du système<select aria-label="Période du système" value={view.temporal === 'same' ? view.period ?? '' : ''} onChange={event => onChange({ period: event.target.value || null, temporal: event.target.value ? 'same' : 'all', edge: null })}><option value="">Toutes les périodes</option>{periodOptions.map(option => <option key={option.id} value={option.id}>{option.cohort?.label ?? periodLabel(option)}</option>)}</select></label>}<p className="system-scope">{view.temporal === 'same' && anchor ? `Période : ${anchor.cohort?.label ?? periodLabel(anchor)} · chevauchements documentés uniquement` : 'Toutes les périodes · dates détaillées dans les passages'}{view.temporal === 'same' && <button onClick={() => onChange({ temporal: 'all', edge: null })}>Toutes les périodes</button>}</p></div>
      {selected?.type === 'person' && <div className="system-group-action"><span>{selected.label}</span><button disabled={view.group?.includes(selected.id)} onClick={() => onChange({ group: [...(view.group ?? []), selected.id] })}>{view.group?.includes(selected.id) ? 'Dans le groupe' : 'Ajouter au groupe'}</button>{(view.group?.length ?? 0) >= 2 && <button onClick={() => onChange({ systemLens: 'common' })}>Voir les points communs</button>}</div>}
    </div>
    {view.system === 'office' && <p className="system-source-scope">{SYSTEM_SCOPE.office}</p>}
    {lens === 'entities' ? <><PoliticalLegend politics={politics} entities={graph.entities} />{children}</> : <div className="system-analysis-scroll"><button className="return-global-map" onClick={() => onChange({ systemLens: 'entities' })}>← Revenir à la carte globale</button>{lens === 'common' ? <CommonInstitutions data={data} records={records} view={view} onChange={onChange} onSelect={onSelect} /> : <InstitutionOverview data={data} records={records} view={view} onChange={onChange} onSelect={onSelect} />}</div>}
  </div>;
}
