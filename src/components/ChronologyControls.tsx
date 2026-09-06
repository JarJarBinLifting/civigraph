'use client';

import { useState } from 'react';
import { TIME_BANDS, type Chronology } from '@/lib/graph-layout';

export function ChronologyControls({ chronology, customYear, onYear }: { chronology: Chronology; customYear: number | null; onYear: (year: number | null) => void }) {
  const [draft, setDraft] = useState(String(chronology.reference.year));
  function commit() {
    if (/^[1-9]\d{0,3}$/.test(draft)) onYear(Number(draft));
    else setDraft(String(chronology.reference.year));
  }
  return <section className="chronology-controls" aria-label="Distance temporelle des entités">
    <div className="chronology-heading"><strong>Distance dans le temps</strong>
      {chronology.reference.kind === 'passage' ? <span className="chronology-reference">Repère : {chronology.reference.label}<button onClick={() => onYear(chronology.reference.year)}>Choisir une année</button></span> : <label>Année repère <input aria-label="Année repère" inputMode="numeric" maxLength={4} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { commit(); event.currentTarget.blur(); } }} /></label>}
      {customYear !== null && <button className="subtle-link" onClick={() => onYear(null)}>Repère initial</button>}
    </div>
    <div className="chronology-legend">{TIME_BANDS.map((label, band) => chronology.counts[band] > 0 && <span key={label}><i className={`time-band band-${band}`} />{label}</span>)}{chronology.unknown > 0 && <span><i className="time-band band-unknown" />Dates inconnues · hors échelle</span>}</div>
    <details className="chronology-explanation"><summary>Lire les distances</summary><p>Les couronnes indiquent l’écart au repère, pas une proximité personnelle. Leur angle n’a pas de signification. L’année repère ne filtre pas les présences. Dates inconnues à droite ; parcours exploré à gauche.</p><p>Disque : personne. Pictogramme : type d’entité. La taille du centre indique son rôle dans l’exploration. Un contour marqué suit la sélection ; le double contour rappelle une étape du parcours.</p></details>
  </section>;
}
