'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';

/** Secondary map controls stay reachable without reserving a row above the canvas. */
export function MapPopover({ label, icon, status, children, className = '' }: {
  label: string; icon: ReactNode; status?: string; children: ReactNode; className?: string;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  function close(restoreFocus = false) {
    if (!details.current) return;
    details.current.open = false;
    if (restoreFocus) details.current.querySelector('summary')?.focus();
  }
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !details.current?.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  return <details ref={details} name="map-options" className={`map-popover ${className}`} onKeyDown={event => {
    if (event.key === 'Escape' && event.currentTarget.open) {
      event.preventDefault(); event.stopPropagation(); close(true);
    }
  }}>
    <summary>{icon}<span>{label}{status && <small>{status}</small>}</span><ChevronDown size={14} /></summary>
    <div className="map-popover-content">
      <div className="map-popover-heading"><strong>{label}</strong><button className="icon-button" aria-label={`Fermer ${label.toLocaleLowerCase('fr')}`} onClick={() => close(true)}><X size={18} /></button></div>
      {children}
    </div>
  </details>;
}
