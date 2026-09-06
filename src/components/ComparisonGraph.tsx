'use client';

import { useEffect, useRef, useState } from 'react';
import type { Core, ElementDefinition } from 'cytoscape';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { CommonConnection, Entity } from '@/lib/types';
import { shortLabel } from '@/lib/presentation';
import { supportsPeriods } from '@/lib/temporal';

export function ComparisonGraph({ left, right, common, selected, onSelect }: { left: Entity; right: Entity; common: CommonConnection[]; selected: string; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const callback = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { callback.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    import('cytoscape').then(({ default: cytoscape }) => {
      if (disposed || !container.current) return;
      const elements: ElementDefinition[] = [
        { data: { id: left.id, label: left.label, color: '#254d40' }, position: { x: -310, y: 0 }, classes: 'person' },
        { data: { id: right.id, label: right.label, color: '#9b713c' }, position: { x: 310, y: 0 }, classes: 'person' },
      ];
      common.forEach((connection, i) => {
        elements.push({ data: { id: connection.entity.id, label: shortLabel(connection.entity), color: '#64795a' }, position: { x: 0, y: (i - (common.length - 1) / 2) * 120 }, classes: `common-entity ${supportsPeriods(connection.entity) ? '' : 'generic-entity'}` });
        for (const [side, person, statements, color] of [['left', left, connection.left, '#254d40'], ['right', right, connection.right, '#9b713c']] as const) {
          elements.push({ data: { id: `${side}:${connection.entity.id}`, source: person.id, target: connection.entity.id, entity: connection.entity.id, label: `${statements.length} déclaration${statements.length > 1 ? 's' : ''}`, color, relationIds: statements.map(statement => statement.id) } });
        }
      });
      const instance = cytoscape({ container: container.current, elements, layout: { name: 'preset', fit: false }, minZoom: .2, maxZoom: 2.5, wheelSensitivity: .2,
        style: [
          { selector: 'node', style: { label: 'data(label)', width: 160, height: 56, shape: 'roundrectangle', 'background-color': '#f4f6ef', 'border-color': 'data(color)', 'border-width': 1.5, color: '#26372f', 'font-size': 14, 'font-family': 'Arial, sans-serif', 'text-wrap': 'wrap', 'text-max-width': '150px', 'text-valign': 'center', 'overlay-opacity': 0 } },
          { selector: 'node.person', style: { width: 68, height: 68, shape: 'ellipse', 'background-color': 'data(color)', 'text-valign': 'bottom', 'text-margin-y': 13, 'font-weight': 'bold' } },
          { selector: 'node.generic-entity', style: { 'border-style': 'dashed' } },
          { selector: 'node.active', style: { 'border-width': 3, 'underlay-color': '#254d40', 'underlay-opacity': .08, 'underlay-padding': 8 } },
          { selector: 'edge', style: { label: 'data(label)', 'font-size': 10, 'text-background-color': '#fff', 'text-background-opacity': .95, 'text-background-padding': '4px', 'line-color': 'data(color)', 'target-arrow-color': 'data(color)', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', width: 2, 'overlay-opacity': 0 } },
          { selector: 'edge.active', style: { width: 3.5 } },
        ],
      });
      cy.current = instance;
      const fit = () => {
        instance.resize();
        const compact = instance.width() < 500;
        instance.$id(left.id).position({ x: compact ? -140 : -310, y: 0 });
        instance.$id(right.id).position({ x: compact ? 140 : 310, y: 0 });
        instance.nodes('.person').style({ width: compact ? 42 : 68, height: compact ? 42 : 68, 'text-max-width': compact ? '85px' : '150px' });
        instance.nodes('.common-entity').style({ width: compact ? 120 : 160, 'text-max-width': compact ? '110px' : '150px' });
        instance.edges().style('text-opacity', compact ? 0 : 1);
        instance.fit(undefined, compact ? 15 : 35);
      };
      instance.on('tap', 'node.common-entity', event => callback.current(event.target.id()));
      instance.on('tap', 'edge', event => callback.current(event.target.data('entity')));
      observer = new ResizeObserver(fit); observer.observe(container.current); fit();
      setReady(true);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; observer?.disconnect(); cy.current?.destroy(); cy.current = null; };
  }, [left, right, common]);
  useEffect(() => {
    const instance = cy.current;
    if (!instance) return;
    instance.elements().removeClass('active');
    instance.$id(selected).addClass('active').connectedEdges().addClass('active');
  }, [selected, ready]);
  return <div className="comparison-map">
    <div className="comparison-map-legend"><span><i style={{ background: '#254d40' }} />{left.label}</span><span>→ Entités communes ←</span><span><i style={{ background: '#9b713c' }} />{right.label}</span></div>
    {failed ? <p role="status">La carte n’est pas disponible dans ce navigateur. Les cartes et leurs sources restent accessibles ci-dessous.</p> : <>
      <div ref={container} className="comparison-canvas" data-testid="comparison-graph" data-ready={ready} role="img" aria-label={`Comparaison de ${left.label} et ${right.label} via ${common.length} entités communes. Les boutons ci-dessous donnent accès aux mêmes preuves au clavier.`} />
      <div className="comparison-map-tools"><button className="icon-button" aria-label="Zoom avant de la comparaison" onClick={() => cy.current?.zoom(cy.current.zoom() * 1.25)}><Plus size={17} /></button><button className="icon-button" aria-label="Zoom arrière de la comparaison" onClick={() => cy.current?.zoom(cy.current.zoom() / 1.25)}><Minus size={17} /></button><button className="icon-button" aria-label="Recentrer la comparaison" onClick={() => cy.current?.fit(undefined, 35)}><Maximize size={16} /></button><span>Un trait regroupe les déclarations d’un seul parcours. Touchez une entité pour ses preuves.</span></div>
    </>}
    <nav className="common-shortcuts" aria-label="Entités communes et preuves">{common.map(({ entity }) => <button key={entity.id} aria-label={`Consulter ${shortLabel(entity)}`} aria-pressed={selected === entity.id} onClick={() => onSelect(entity.id)}>{shortLabel(entity)}</button>)}</nav>
  </div>;
}
