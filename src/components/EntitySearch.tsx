'use client';

import { useId, useRef, useState } from 'react';
import { Search, ArrowUpRight, X } from 'lucide-react';
import { searchEntities } from '@/lib/graph';
import { initials, shortLabel, typeInfo } from '@/lib/presentation';
import type { Entity, GraphData } from '@/lib/types';

interface Props {
  data: GraphData;
  onSelect: (entity: Entity) => void;
  peopleOnly?: boolean;
  label?: string;
  placeholder?: string;
  exclude?: string;
}

export function EntitySearch({ data, onSelect, peopleOnly = false, label = 'Rechercher une personne ou une organisation', placeholder = 'Une personne, une école, un parti…', exclude }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = searchEntities(data, query, peopleOnly).filter(entity => entity.id !== exclude).slice(0, 8);
  function choose(entity: Entity) { onSelect(entity); setQuery(''); setOpen(false); setActive(0); }
  return <div className="entity-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <Search size={18} aria-hidden="true" />
    <input ref={input} value={query} aria-label={label} placeholder={placeholder} role="combobox" aria-expanded={open} aria-controls={`${id}-results`} aria-autocomplete="list" aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined}
      onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { setOpen(false); return; }
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(index => Math.min(index + 1, results.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(index - 1, 0)); }
        if (event.key === 'Enter' && open && results[active]) { event.preventDefault(); choose(results[active]); }
      }} />
    {query ? <button className="icon-button search-clear" aria-label="Effacer la recherche" onClick={() => { setQuery(''); input.current?.focus(); }}><X size={15} /></button> : <span className="search-hint" aria-hidden="true">Rechercher</span>}
    {open && <div className="search-popover">
      <p className="eyebrow">{query ? `${results.length}${results.length === 8 ? '+' : ''} résultat${results.length > 1 ? 's' : ''}` : 'Dans le corpus'}</p>
      <ul id={`${id}-results`} role="listbox" aria-label="Résultats de recherche">
        {results.map((entity, index) => <li key={entity.id} id={`${id}-${index}`} role="option" aria-selected={index === active}>
          <button tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => choose(entity)} onMouseEnter={() => setActive(index)}>
            <span className="mini-avatar" style={{ background: typeInfo[entity.type].soft, color: typeInfo[entity.type].color }}>{initials(entity.label)}</span>
            <span><strong>{shortLabel(entity)}</strong><small>{typeInfo[entity.type].label}</small></span><ArrowUpRight size={16} />
          </button>
        </li>)}
      </ul>
      {!results.length && <p className="empty-search">Aucun résultat dans ce corpus de {data.meta.peopleCount} personnes. Essayez un autre nom ou une institution.</p>}
    </div>}
  </div>;
}
