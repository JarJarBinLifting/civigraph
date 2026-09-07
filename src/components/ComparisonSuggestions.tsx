'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { getComparisonSuggestions } from '@/lib/comparison-suggestions';
import { shortLabel } from '@/lib/presentation';
import type { Category, Entity, GraphData } from '@/lib/types';
import { EntityAvatar } from './EntityAvatar';
import { ImageCredit } from './ImageCredit';

export function ComparisonSuggestions({ data, person, categories, onChoose }: {
  data: GraphData; person: Entity; categories: Category[]; onChoose: (person: Entity) => void;
}) {
  const suggestions = useMemo(() => getComparisonSuggestions(data, person.id, categories), [data, person.id, categories]);
  return <section className="comparison-discovery" aria-label="Suggestions de comparaison">
    <h3>Qui partage des éléments de son parcours ?</h3>
    <p>Écoles, administrations, entreprises ou partis en commun avec {person.label}, selon les filtres actifs.</p>
    {suggestions.length ? <>
      <div className="comparison-candidates">{suggestions.slice(0, 6).map(({ person: candidate, connections, sharedPeriodCount }) => <article className="comparison-candidate" key={candidate.id}>
        <div className="candidate-person"><EntityAvatar entity={candidate} /><h4>{candidate.label}</h4></div>
        <p className="candidate-count"><strong>{connections.length}</strong> {connections.length === 1 ? 'institution commune' : 'institutions communes'}</p>
        <p className="candidate-periods">{sharedPeriodCount ? `${sharedPeriodCount} avec une période commune documentée` : 'Périodes communes non établies'}</p>
        <ul>{connections.slice(0, 3).map(connection => <li key={connection.entity.id}><span>{shortLabel(connection.entity)}</span>{connection.sharedPeriod && <small>Période commune documentée</small>}</li>)}</ul>
        {connections.length > 3 && <p className="candidate-more">Et {connections.length - 3} {connections.length - 3 === 1 ? 'autre institution' : 'autres institutions'} à découvrir</p>}
        <button className="secondary-button candidate-action" aria-label={`Comparer avec ${candidate.label}`} onClick={() => onChoose(candidate)}>Voir les points communs<ArrowRight size={15} /></button>
        {candidate.image && <ImageCredit image={candidate.image} />}
      </article>)}</div>
      <p className="discovery-method">{Math.min(suggestions.length, 6)} profils proposés sur {suggestions.length}. Classés par nombre d’institutions distinctes en commun, puis de périodes communes documentées. Plusieurs sources pour une même institution ne la font compter qu’une fois.</p>
    </> : <div className="empty-state"><strong>{categories.length ? 'Aucune institution commune trouvée avec ces filtres' : 'Choisissez au moins un type de relation'}</strong><p>Vous pouvez modifier les filtres ou rechercher directement une deuxième personne ci-dessus.</p></div>}
    <p className="discovery-limit">Ces suggestions dépendent des parcours renseignés dans ce corpus limité. Elles ne mesurent pas une proximité personnelle. La comparaison permet de consulter les dates et les sources.</p>
  </section>;
}
