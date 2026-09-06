'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minus, Plus, MousePointer2 } from 'lucide-react';
import type { Core } from 'cytoscape';
import { categoryInfo, initials, shortLabel, typeInfo } from '@/lib/presentation';
import type { Entity, Relation } from '@/lib/types';

interface Props {
  entities: Entity[];
  relations: Relation[];
  root: string;
  selected: string;
  selectedEdge: string | null;
  compare: string | null;
  onSelect: (id: string) => void;
  onEdge: (id: string) => void;
  onExpand: (id: string) => void;
  onFallback: () => void;
}

function badge(entity: Entity, root: boolean) {
  const color = root ? '#ffffff' : typeInfo[entity.type].color;
  const content = entity.type === 'person'
    ? `<text x="32" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="24" stroke="none" fill="${color}">${initials(entity.label)}</text>`
    : entity.type === 'school' ? `<path d="m12 26 20-10 20 10-20 10-20-10m8 6v12c8 6 16 6 24 0V32M52 27v16"/>`
    : entity.type === 'office' ? `<path d="m13 25 19-10 19 10H13m4 5v16m10-16v16m10-16v16m10-16v16M12 50h40"/>`
    : entity.type === 'party' ? `<path d="M21 51V14m0 2c12-8 17 9 28 1v23c-11 8-16-9-28-1"/>`
    : `<rect x="18" y="17" width="28" height="33" rx="2"/><path d="M25 24h4m6 0h4m-14 8h4m6 0h4m-14 8h4m6 0h4m-5 10v-7"/>`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${content}</g></svg>`)}`;
}

export function GraphCanvas(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const callbacks = useRef(props);
  const [ready, setReady] = useState(false);
  useEffect(() => { callbacks.current = props; });
  const { entities, relations, root, selected, selectedEdge, compare } = props;

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    import('cytoscape').then(({ default: cytoscape }) => {
      if (disposed || !container.current) return;
      const neighbors = entities.filter(entity => entity.id !== root).sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label, 'fr'));
      const count = neighbors.length;
      const mobile = container.current.clientWidth < 500;
      const radius = count > 28 ? 285 : count > 20 ? 235 : 195;
      const positions = new Map(neighbors.map((entity, index) => {
        const angle = ((index / count) * Math.PI * 2) - Math.PI / 2;
        const ring = count > 32 && index % 2 === 1 ? radius + 150 : radius;
        return [entity.id, { x: Math.cos(angle) * ring * 1.35, y: Math.sin(angle) * ring }];
      }));
      const instance = cytoscape({
        container: container.current,
        elements: [
          ...entities.map(entity => {
            const point = positions.get(entity.id);
            const location = point && Math.abs(point.x) > radius * .95 ? (point.x < 0 ? 'label-left' : 'label-right') : point && point.y < 0 ? 'label-top' : '';
            return { data: { id: entity.id, label: shortLabel(entity).replace('président ou présidente', 'président').replace('Président ou présidente', 'Président'), color: typeInfo[entity.type].color, soft: typeInfo[entity.type].soft, badge: badge(entity, entity.id === root), isRoot: entity.id === root ? 1 : 0 }, position: entity.id === root ? { x: 0, y: 0 } : point, classes: entity.id === root ? 'root' : location };
          }),
          ...relations.map(relation => ({ data: { id: relation.id, source: relation.source, target: relation.target, color: categoryInfo[relation.category].color, label: categoryInfo[relation.category].singular } })),
        ],
        layout: { name: 'preset', fit: true, padding: 64 },
        minZoom: 0.18, maxZoom: 2.8, wheelSensitivity: 0.22,
        style: [
          { selector: 'node', style: { width: mobile ? 60 : 47, height: mobile ? 60 : 47, 'background-color': 'data(soft)', 'background-image': 'data(badge)', 'background-width': '76%', 'background-height': '76%', 'border-width': 1.2, 'border-color': 'data(color)', label: 'data(label)', 'font-family': 'Arial, sans-serif', 'font-size': mobile ? 16 : 12, color: '#343d38', 'text-valign': 'bottom', 'text-margin-y': 10, 'text-wrap': 'wrap', 'text-max-width': '115px', 'text-background-color': '#fafbf8', 'text-background-opacity': 0.93, 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle', 'overlay-opacity': 0 } },
          { selector: 'node.label-left', style: { 'text-halign': 'left', 'text-valign': 'center', 'text-margin-x': -11, 'text-margin-y': 0 } },
          { selector: 'node.label-right', style: { 'text-halign': 'right', 'text-valign': 'center', 'text-margin-x': 11, 'text-margin-y': 0 } },
          { selector: 'node.label-top', style: { 'text-valign': 'top', 'text-margin-y': -11 } },
          { selector: 'node.root', style: { width: 76, height: 76, 'background-color': '#254d40', 'border-color': '#254d40', 'border-width': 4, 'font-size': 14, 'font-weight': 'bold', 'text-margin-y': 12 } },
          { selector: 'node.active', style: { 'border-width': 3, 'border-color': '#254d40', 'underlay-color': '#254d40', 'underlay-opacity': 0.07, 'underlay-padding': 8 } },
          { selector: 'node.root.active', style: { 'underlay-opacity': 0, 'text-max-width': '180px', 'font-size': 15 } },
          { selector: 'node.compared', style: { 'border-width': 3, 'border-color': '#a47947', 'underlay-color': '#a47947', 'underlay-opacity': 0.08, 'underlay-padding': 8 } },
          { selector: 'edge', style: { width: 1.1, 'line-color': 'data(color)', opacity: 0.42, 'curve-style': 'bezier', 'control-point-step-size': 24, 'overlay-padding': 9, 'overlay-opacity': 0 } },
          { selector: 'edge.hover, edge.active', style: { width: 2.2, opacity: 1, label: 'data(label)', 'font-size': 10, 'text-rotation': 'autorotate', color: '#34463d', 'text-background-color': '#fafbf8', 'text-background-opacity': 1, 'text-background-padding': '4px' } },
        ],
      });
      cy.current = instance;
      instance.on('tap', 'node', event => callbacks.current.onSelect(event.target.id()));
      instance.on('dbltap', 'node', event => callbacks.current.onExpand(event.target.id()));
      instance.on('tap', 'edge', event => callbacks.current.onEdge(event.target.id()));
      instance.on('mouseover', 'edge', event => { event.target.addClass('hover'); if (container.current) container.current.style.cursor = 'pointer'; });
      instance.on('mouseout', 'edge', event => { event.target.removeClass('hover'); if (container.current) container.current.style.cursor = 'grab'; });
      instance.on('mouseover', 'node', () => { if (container.current) container.current.style.cursor = 'pointer'; });
      instance.on('mouseout', 'node', () => { if (container.current) container.current.style.cursor = 'grab'; });
      instance.getElementById(callbacks.current.selected).addClass('active');
      if (callbacks.current.compare) instance.getElementById(callbacks.current.compare).addClass('compared');
      if (callbacks.current.selectedEdge) instance.getElementById(callbacks.current.selectedEdge).addClass('active');
      observer = new ResizeObserver(() => {
        instance.resize(); instance.fit(undefined, mobile ? 24 : 45);
        if (mobile && instance.zoom() < .65) { instance.zoom(.65); instance.center(instance.getElementById(root)); }
      });
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!disposed) callbacks.current.onFallback(); });
    return () => { disposed = true; observer?.disconnect(); cy.current?.destroy(); cy.current = null; };
  }, [entities, relations, root]);

  useEffect(() => {
    cy.current?.elements().removeClass('active compared');
    cy.current?.getElementById(selected).addClass('active');
    if (selectedEdge) cy.current?.getElementById(selectedEdge).addClass('active');
    if (compare) cy.current?.getElementById(compare).addClass('compared');
  }, [selected, selectedEdge, compare]);

  return <div className="graph-stage" data-testid="graph-stage" data-ready={ready}>
    <div className="graph-canvas" ref={container} role="img" aria-label={`Graphe de ${entities.length} entités et ${relations.length} relations. Utilisez le mode Liste pour explorer au clavier.`} />
    <div className="graph-compass" aria-hidden="true"><span>N</span><i /><small>VUE RELATIONNELLE</small></div>
    <div className="graph-controls" aria-label="Contrôles du graphe">
      <button className="icon-button" aria-label="Zoom avant" onClick={() => cy.current?.zoom({ level: cy.current.zoom() * 1.25, renderedPosition: { x: (container.current?.clientWidth ?? 0) / 2, y: (container.current?.clientHeight ?? 0) / 2 } })}><Plus size={18} /></button>
      <button className="icon-button" aria-label="Zoom arrière" onClick={() => cy.current?.zoom({ level: cy.current.zoom() / 1.25, renderedPosition: { x: (container.current?.clientWidth ?? 0) / 2, y: (container.current?.clientHeight ?? 0) / 2 } })}><Minus size={18} /></button>
      <span /><button className="icon-button" aria-label="Recentrer le graphe" onClick={() => cy.current?.fit(undefined, 64)}><Maximize size={17} /></button>
    </div>
    <p className="graph-tip"><MousePointer2 size={13} /><span className="desktop-tip">Un clic pour comprendre. Deux pour explorer.</span><span className="mobile-tip">Glissez ou zoomez pour explorer.</span></p>
  </div>;
}
