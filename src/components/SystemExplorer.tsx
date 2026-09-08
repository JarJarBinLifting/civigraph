'use client';

import { useMemo, type ReactNode } from 'react';
import type { Entity, GraphData, ViewState } from '@/lib/types';
import type { SystemGraph } from '@/lib/system-graph';
import { institutionParticipation } from '@/lib/system-analysis';
import { periodLabel } from '@/lib/presentation';
import { getPeriodContext } from '@/lib/graph';
import { supportsPeriods } from '@/lib/temporal';
import { SYSTEM_SCOPE, type PoliticalIndex } from '@/lib/system-reading';
import { InstitutionOverview } from './InstitutionOverview';
import { CommonInstitutions } from './CommonInstitutions';
import { PoliticalLegend } from './PoliticalLegend';
import { NetworkInsights } from './NetworkInsights';
import { GuidedNetworks } from './GuidedNetworks';

export function SystemExplorer({ data, graph, politics, view, onChange, onSelect, onReveal, onOpenView, children }: {
  data: GraphData; graph: SystemGraph; view: ViewState; selected?: Entity;
  politics: PoliticalIndex;
  onOpenView: (view: ViewState) => void;
  onChange: (patch: Partial<ViewState>) => void; onSelect: (id: string) => void; onReveal: (id: string) => void; children: ReactNode;
}) {
  const lens = view.systemLens ?? 'entities';
  const records = useMemo(() => institutionParticipation(graph), [graph]);
  return <div className={`system-explorer lens-${lens}`}>
    {view.system === 'office' && lens !== 'guided' && <p className="system-source-scope">{SYSTEM_SCOPE.office}</p>}
    {lens === 'entities' ? <><PoliticalLegend politics={politics} entities={graph.entities} />{children}</> : <div className="system-analysis-scroll"><button className="return-global-map" onClick={() => onChange({ systemLens: 'entities' })}>← Revenir à la carte globale</button>{lens === 'guided' ? <GuidedNetworks onOpenView={onOpenView} data={data} view={view} onChange={onChange} onReveal={onReveal} /> : lens === 'circles' || lens === 'milieus' ? <NetworkInsights key={lens} data={data} relations={graph.relations} view={view} onChange={onChange} onReveal={onReveal} /> : lens === 'common' ? <CommonInstitutions data={data} records={records} view={view} onChange={onChange} onSelect={onSelect} /> : <InstitutionOverview data={data} records={records} view={view} onChange={onChange} onSelect={onSelect} />}</div>}
  </div>;
}

export function SystemPeriodFilter({ data, view, selected, onChange }: {
  data: GraphData; view: ViewState; selected?: Entity; onChange: (patch: Partial<ViewState>) => void;
}) {
  const anchor = data.relations.find(r => r.id === view.period);
  const periodEntity = (selected && supportsPeriods(selected) ? selected : undefined) ?? data.entities.find(e => e.id === view.institution);
  const periodContext = useMemo(() => periodEntity ? getPeriodContext(data, { ...view, focus: periodEntity.id, expanded: [periodEntity.id] }) : undefined, [data, view, periodEntity]);
  const options = periodContext?.options ?? [];
  const periodOptions = anchor && !options.some(r => r.id === anchor.id) ? [anchor, ...options] : options;
  return <div className="system-time-row">{periodOptions.length > 0 && <label>Période du système<select aria-label="Période du système" value={view.temporal === 'same' ? view.period ?? '' : ''} onChange={event => onChange({ period: event.target.value || null, temporal: event.target.value ? 'same' : 'all', edge: null })}><option value="">Toutes les périodes</option>{periodOptions.map(option => <option key={option.id} value={option.id}>{option.cohort?.label ?? periodLabel(option)}</option>)}</select></label>}<p className="system-scope">{view.temporal === 'same' && anchor ? `Période : ${anchor.cohort?.label ?? periodLabel(anchor)} · chevauchements documentés uniquement` : 'Toutes les périodes · dates détaillées dans les passages'}{view.temporal === 'same' && <button onClick={() => onChange({ temporal: 'all', edge: null })}>Toutes les périodes</button>}</p></div>;
}
