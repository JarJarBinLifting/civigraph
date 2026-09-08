'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, Building2, Compass, GitCompareArrows, UserRound } from 'lucide-react';
import { createPresetView, INSTITUTION_TYPES, presetExamples, presetQuestion, type ExplorationPreset } from '@/lib/exploration-presets';
import { getGraphIndex } from '@/lib/graph-index';
import { shortLabel } from '@/lib/presentation';
import type { Entity, GraphData, ViewState } from '@/lib/types';
import { EntitySearch } from './EntitySearch';
import { EntityAvatar } from './EntityAvatar';
import { Modal } from './Modal';
import styles from './ExplorationPresets.module.css';

export type PresetPicker = { kind: ExplorationPreset | 'examples'; person?: string; institution?: string };

const entries = [
  { kind: 'person', label: 'Explorer une personnalité', icon: UserRound },
  { kind: 'institution', label: 'Explorer une école ou une organisation', icon: Building2 },
  { kind: 'comparison', label: 'Comparer deux parcours', icon: GitCompareArrows },
  { kind: 'examples', label: 'Découvrir un exemple', icon: Compass },
] as const;

export function ExplorationEntries({ onChoose }: { onChoose: (picker: PresetPicker) => void }) {
  return <nav className={styles.entries} aria-label="Points de départ">
    {entries.map(({ kind, label, icon: Icon }) => <button key={kind} onClick={() => onChoose({ kind })}>
      <Icon size={18} aria-hidden="true" /><span>{label}</span><ArrowRight size={15} aria-hidden="true" />
    </button>)}
  </nav>;
}

export function PresetControls({ guided, children }: { guided: boolean; children: ReactNode }) {
  return guided ? <details className={styles.controls}><summary>Ajuster la vue</summary>{children}</details> : <>{children}</>;
}

export function PresetQuestion({ data, view, onChoose, onOpen }: {
  data: GraphData; view: ViewState; onChoose: (picker: PresetPicker) => void; onOpen: (view: ViewState) => void;
}) {
  const question = presetQuestion(data, view);
  if (!question) return null;
  const person = getGraphIndex(data).entities.get(view.root)!;
  return <section className={styles.question} aria-label="Question explorée">
    <h1 id="preset-question" tabIndex={-1}>{question}</h1>
    {view.preset === 'person' && <button onClick={() => onChoose({ kind: 'comparison', person: view.root })}>Comparer ce parcours<ArrowRight size={16} /></button>}
    {view.preset === 'institution' && <button onClick={() => onChoose({ kind: 'person', institution: view.root })}>Explorer un parcours<ArrowRight size={16} /></button>}
    {view.preset === 'comparison' && <button onClick={() => { const next = createPresetView(data, 'person', view.root); if (next) onOpen(next); }}>Explorer {shortLabel(person)}<ArrowRight size={16} /></button>}
  </section>;
}

export function PresetDialog({ data, picker, onOpen, onClose }: {
  data: GraphData; picker: PresetPicker; onOpen: (view: ViewState) => void; onClose: () => void;
}) {
  const index = useMemo(() => getGraphIndex(data), [data]);
  const [left, setLeft] = useState<Entity | undefined>(() => index.entities.get(picker.person ?? ''));
  const [right, setRight] = useState<Entity>();
  const searchData = useMemo(() => {
    const neighbors = picker.institution ? new Set((index.incident.get(picker.institution) ?? []).flatMap(relation => [relation.source, relation.target])) : null;
    const entities = data.entities.filter(entity => picker.kind === 'institution'
      ? INSTITUTION_TYPES.some(type => type === entity.type)
      : entity.type === 'person' && entity.inCorpus && (!neighbors || neighbors.has(entity.id)));
    return { ...data, entities };
  }, [data, index, picker]);
  const examples = useMemo(() => presetExamples(data), [data]);
  const suggestions = (picker.kind === 'institution' ? ['Q273579', 'Q859363'] : ['Q3052772', 'Q364315'])
    .map(id => searchData.entities.find(entity => entity.id === id)).filter((entity): entity is Entity => Boolean(entity));
  const title = picker.kind === 'examples' ? 'Par où commencer ?'
    : picker.kind === 'institution' ? 'Quelle école ou organisation explorer ?'
    : picker.kind === 'comparison' ? 'Quels parcours comparer ?'
    : picker.institution ? `${shortLabel(index.entities.get(picker.institution)!)} : quel parcours explorer ?`
    : 'Quelle personnalité explorer ?';
  function open(entity: Entity) {
    const next = createPresetView(data, picker.kind === 'institution' ? 'institution' : 'person', entity.id);
    if (next) onOpen(next);
  }
  return <Modal title={title} onClose={onClose}>
    <div className={styles.picker}>
      {picker.kind === 'examples' ? <div className={styles.examples}>
        {examples.map(example => <button key={`${example.preset}:${example.root}`} onClick={() => onOpen(example)}>{presetQuestion(data, example)}<ArrowRight size={18} /></button>)}
      </div> : picker.kind === 'comparison' ? <>
        <div className={styles.comparisonPickers}>
          <div><label>Premier parcours</label>{left && <strong>{shortLabel(left)}</strong>}<EntitySearch data={searchData} peopleOnly exclude={right?.id} label="Premier parcours du preset" placeholder="Choisir une personne…" onSelect={setLeft} /></div>
          <div><label>Second parcours</label>{right && <strong>{shortLabel(right)}</strong>}<EntitySearch data={searchData} peopleOnly exclude={left?.id} label="Second parcours du preset" placeholder="Choisir une autre personne…" onSelect={setRight} /></div>
        </div>
        <button className="primary-button" disabled={!left || !right} onClick={() => { if (left && right) { const next = createPresetView(data, 'comparison', left.id, right.id); if (next) onOpen(next); } }}>Voir les points communs<ArrowRight size={16} /></button>
      </> : <>
        <EntitySearch data={searchData} label={picker.kind === 'person' ? 'Personnalité à explorer' : 'École ou organisation à explorer'} placeholder={picker.kind === 'person' ? 'Rechercher une personne…' : 'Rechercher une école ou une organisation…'} onSelect={open} />
        <div className={styles.suggestions}>{suggestions.map(entity => <button key={entity.id} onClick={() => open(entity)}><EntityAvatar entity={entity} /><span>{shortLabel(entity)}</span><ArrowRight size={16} /></button>)}</div>
      </>}
    </div>
  </Modal>;
}
