'use client';

import { ArrowUpRight, CalendarDays, BookOpen } from 'lucide-react';
import { getPeriodContext, getUncertainConnections, matchesPeriod } from '@/lib/graph';
import { comparePeriods, periodBounds } from '@/lib/temporal';
import { periodLabel, shortLabel } from '@/lib/presentation';
import type { GraphData, ViewState } from '@/lib/types';

export function PeriodControls({ data, view, onChange, onEvidence, onSelect, onCareer }: {
  data: GraphData;
  view: ViewState;
  onChange: (patch: Partial<ViewState>) => void;
  onEvidence: (id: string) => void;
  onSelect: (id: string) => void;
  onCareer: (id: string) => void;
}) {
  const context = getPeriodContext(data, view);
  if (!context.institution) return null;
  const options = context.anchor && !context.options.some(option => option.id === context.anchor!.id) ? [context.anchor, ...context.options] : context.options;
  const selected = context.anchor ?? options[0];
  const relations = data.relations.filter(relation => (relation.source === view.focus || relation.target === view.focus) && view.categories.includes(relation.category));
  const unknown = relations.filter(relation => !periodBounds(relation)).length;
  const possible = selected ? relations.filter(relation => relation.id !== selected.id && comparePeriods(relation, selected) === 'possible').length : 0;
  const matching = selected ? relations.filter(relation => matchesPeriod(relation, selected, 'same')).length : 0;
  const anchorInstitution = data.entities.find(entity => entity.id === selected?.target);
  const local = !selected || selected.target === context.institution.id;
  const uncertain = getUncertainConnections(data, view);
  return <section className="period-controls" aria-label="Exploration par période">
    <div className="period-controls-heading"><span><CalendarDays size={16} /><strong>Explorer dans le temps</strong></span><div className="period-mode" role="group" aria-label="Périmètre temporel">
      <button aria-pressed={view.temporal === 'same'} disabled={!selected} onClick={() => onChange({ temporal: 'same', period: selected!.id, edge: null })}>Même période</button>
      <button aria-pressed={view.temporal === 'all'} onClick={() => onChange({ temporal: 'all', period: selected?.id ?? null, edge: null })}>Toutes les périodes</button>
    </div></div>
    {selected ? <div className="period-choice"><label htmlFor="exploration-period">{local && context.reference ? `Passage : ${shortLabel(context.reference)}` : anchorInstitution ? `Repère : ${shortLabel(anchorInstitution)}` : 'Période documentée'}</label><select id="exploration-period" value={selected.id} onChange={event => onChange({ period: event.target.value, temporal: 'same', edge: null })}>
      {options.map(option => <option key={option.id} value={option.id}>{option.cohort?.label ?? periodLabel(option)}</option>)}
    </select><button className="subtle-link" onClick={() => onEvidence(selected.id)}><BookOpen size={13} />Source de la période</button></div> : <p className="period-empty">{context.reference ? `Le passage de ${shortLabel(context.reference)} n’a pas de période exploitable dans ce corpus.` : 'Aucune période exploitable n’est renseignée pour cette institution.'} Les liens restent disponibles en toutes périodes.</p>}
    <p className="period-summary" role="status">{view.graphView === 'system' && `Autour de ${shortLabel(context.institution)} : `}{view.temporal === 'same' ? `${matching} lien${matching > 1 ? 's' : ''} sur la période retenue.` : 'Toutes les participations du corpus, quelle que soit leur période.'}{unknown > 0 && ` ${unknown} lien${unknown > 1 ? 's' : ''} sans période exploitable.`}{possible > 0 && ` ${possible} chevauchement${possible > 1 ? 's' : ''} incertain${possible > 1 ? 's' : ''}.`}</p>
    {uncertain.length > 0 && <details key={`${view.focus}:${view.period}`} className="uncertain-connections">
      <summary>Autres personnes liées <span>{uncertain.length}</span><small>Dates insuffisantes</small></summary>
      <p>Leur lien avec {shortLabel(context.institution)} est documenté. Leur présence sur la période retenue n’est pas établie.</p>
      <div className="uncertain-list" aria-label="Personnes dont la période reste à préciser" tabIndex={0}>
        {uncertain.map(({ entity, relations }) => <article key={entity.id}>
          <div className="uncertain-person"><button onClick={() => onSelect(entity.id)}>{shortLabel(entity)}</button><button aria-label={`Explorer la carrière de ${shortLabel(entity)}`} onClick={() => onCareer(entity.id)}>Toute sa carrière<ArrowUpRight size={13} /></button></div>
          {relations.map(relation => <button key={relation.id} className="uncertain-proof" onClick={() => onEvidence(relation.id)} aria-label={`Source du lien de ${shortLabel(entity)} : ${periodLabel(relation)}`}><BookOpen size={12} /><span>{relation.role ?? relation.label} · {periodLabel(relation)}</span></button>)}
        </article>)}
      </div>
    </details>}
  </section>;
}
