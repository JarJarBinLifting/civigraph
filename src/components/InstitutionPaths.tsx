'use client';

import { useMemo } from 'react';
import { findInstitutionalPaths } from '@/lib/paths';
import { shortLabel, periodLabel } from '@/lib/presentation';
import type { Category, Entity, GraphData } from '@/lib/types';
import { RelationEvidence } from './DetailPanel';

export function InstitutionPaths({ data, left, right, categories, onExplore }: { data: GraphData; left: Entity; right: Entity; categories: Category[]; onExplore: (id: string) => void }) {
  const result = useMemo(() => findInstitutionalPaths(data, left.id, right.id, categories), [data, left.id, right.id, categories]);
  return <section className="institution-paths" aria-label="Chemins institutionnels">
    <h3>Par quelles institutions leurs parcours sont-ils reliés ?</h3>
    <p className="comparison-note">Toutes périodes · Chaque segment peut appartenir à une époque différente. Ce parcours ne prouve ni une rencontre, ni l’existence du chemin entier à une même date.</p>
    <p className="section-caption">Jusqu’à 3 chemins courts, 4 segments au maximum. Les fonctions génériques sans contexte et les liens directs entre personnes sont exclus de cette recherche institutionnelle.</p>
    {result.limited && <p className="inline-notice" role="status">La limite de recherche a été atteinte. D’autres chemins peuvent exister dans le corpus.</p>}
    {!result.paths.length && <div className="empty-state"><strong>Aucun chemin trouvé dans le corpus avec ces filtres et cette profondeur</strong><p>L’absence de résultat ne démontre pas l’absence de lien.</p></div>}
    {result.paths.map((path, i) => <article className="institution-path" key={path.entities.map(entity => entity.id).join(':')}>
      <div className="path-heading"><span className="eyebrow">Chemin {i + 1}</span><span>{path.segments.length} segments · {path.segments.reduce((sum, segment) => sum + segment.relations.length, 0)} déclarations</span></div>
      <ol className="path-chain" aria-label={`Parcours du chemin ${i + 1}`}>{path.entities.map(entity => <li key={entity.id}><button onClick={() => onExplore(entity.id)}>{shortLabel(entity)}</button></li>)}</ol>
      <div className="path-segments">{path.segments.map((segment, number) => <details key={`${segment.from}:${segment.to}`}>
        <summary><span>Segment {number + 1} · {shortLabel(path.entities[number])} — {shortLabel(path.entities[number + 1])}</span><small>{segment.relations.length} source{segment.relations.length > 1 ? 's' : ''} · {segment.relations.map(relation => periodLabel(relation)).filter((value, index, values) => values.indexOf(value) === index).join(' / ')}</small></summary>
        <p className="section-caption">Sens et périodes de chaque déclaration d’origine :</p>
        {segment.relations.map(relation => <RelationEvidence key={relation.id} relation={relation} data={data} compact />)}
      </details>)}</div>
    </article>)}
  </section>;
}
