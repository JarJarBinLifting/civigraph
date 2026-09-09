'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { Search, ArrowUpRight, X } from 'lucide-react';
import { searchEntities } from '@/lib/graph';
import { shortLabel, typeInfo } from '@/lib/presentation';
import { EntityAvatar } from './EntityAvatar';
import type { Entity, GraphData } from '@/lib/types';

interface Props {
  data: GraphData;
  onSelect: (entity: Entity) => void;
  peopleOnly?: boolean;
  label?: string;
  placeholder?: string;
  exclude?: string;
  suggestions?: ReactNode;
}

export function EntitySearch({ data, onSelect, peopleOnly = false, label = 'Rechercher une personne ou une organisation', placeholder = 'Une personne, une école, un parti…', exclude, suggestions }: Props) {
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
      {!query && suggestions}
      <p className="eyebrow">{query ? `${results.length}${results.length === 8 ? '+' : ''} résultat${results.length > 1 ? 's' : ''}` : 'Personnes et institutions'}</p>
      <ul id={`${id}-results`} role="listbox" aria-label="Résultats de recherche">
        {results.map((entity, index) => <li key={entity.id} id={`${id}-${index}`} role="option" aria-selected={index === active}>
          <button tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => choose(entity)} onMouseEnter={() => setActive(index)}>
            <EntityAvatar entity={entity} />
            <span><strong>{shortLabel(entity)}</strong><small>{typeInfo[entity.type].label}</small></span><ArrowUpRight size={16} />
          </button>
        </li>)}
      </ul>
      {!results.length && <p className="empty-search">Aucun résultat. Le site recense {data.meta.peopleCount} personnes : essayez un autre nom, une école ou un parti.</p>}
    </div>}
  </div>;
}
