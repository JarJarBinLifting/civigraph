'use client';

import { useState } from 'react';
import type { Entity } from '@/lib/types';
import type { PoliticalAffiliation, PoliticalIndex } from '@/lib/system-reading';
import { UNKNOWN_POLITICAL_COLOR } from '@/lib/system-reading';
import { shortLabel, typeInfo } from '@/lib/presentation';

export function PoliticalBadges({ affiliations }: { affiliations: PoliticalAffiliation[] }) {
  return <span className="political-badges">{affiliations.length ? affiliations.map(a => <span key={a.party.id} title={a.party.label}><i style={{ background: a.color }} />{shortLabel(a.party)}</span>) : <span><i style={{ background: UNKNOWN_POLITICAL_COLOR }} />Non documentée</span>}</span>;
}

export function PoliticalLegend({ politics, entities }: { politics: PoliticalIndex; entities: Entity[] }) {
  const [query, setQuery] = useState('');
  const ids = new Set(entities.filter(e => e.type === 'person').map(e => e.id));
  const counts = new Map<string, number>();
  let unknown = 0, multiple = 0;
  for (const id of ids) {
    const affiliations = politics.people.get(id) ?? [];
    if (!affiliations.length) unknown++;
    if (affiliations.length > 1) multiple++;
    for (const a of affiliations) counts.set(a.party.id, (counts.get(a.party.id) ?? 0) + 1);
  }
  const parties = politics.parties.filter(p => counts.has(p.entity.id)).sort((a, b) => counts.get(b.entity.id)! - counts.get(a.entity.id)! || a.entity.label.localeCompare(b.entity.label, 'fr'));
  return <div className="political-legend" aria-label="Légende des appartenances politiques">
    <details name="map-options" className="political-legend-details" onKeyDown={event => {
      if (event.key === 'Escape' && event.currentTarget.open) {
        event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus();
      }
    }}><summary>Légende et aide</summary><div className="political-legend-content">
      <p><strong>Lire la carte.</strong> Un clic ouvre la fiche. Double-cliquez pour atténuer le reste du réseau. La disposition ne mesure ni influence ni proximité personnelle.</p>
      <div className="political-legend-types">{Object.entries(typeInfo).filter(([type]) => type !== 'person' && type !== 'party').map(([type, info]) => <span key={type}><i style={{ background: info.color }} />{info.label}</span>)}</div>
      <p>Partis, groupes parlementaires et statuts selon les sources. Couleurs d’identification, sans classement idéologique. Toutes les appartenances du corpus sont conservées, historiques ou multiples ; elles ne signifient pas une adhésion actuelle ni une adhésion au moment d’un passage.</p>
      <p>Un disque partagé indique plusieurs appartenances ({multiple} personnes). Gris : aucune appartenance documentée ({unknown} personnes). Les institutions sont carrées ; en lecture Groupes, leur étiquette indique le nombre de personnes distinctes. Les nombres ci-dessous comptent des personnes et ne s’additionnent pas.</p>
      <label>Rechercher une appartenance<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom du parti…" /></label>
      <ul>{parties.filter(p => p.entity.label.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))).map(p => <li key={p.entity.id}><i style={{ background: p.color }} /><span>{p.entity.label}</span><strong>{counts.get(p.entity.id)}</strong></li>)}</ul>
      {!parties.length && <p>Aucune appartenance politique documentée parmi les personnes de ce périmètre.</p>}
    </div></details>
  </div>;
}
