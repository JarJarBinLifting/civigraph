'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minus, Plus, MousePointer2 } from 'lucide-react';
import type { Core, Position } from 'cytoscape';
import { categoryInfo, initials, shortLabel, typeInfo } from '@/lib/presentation';
import type { Entity, Relation } from '@/lib/types';
import { layoutGraph, TIME_BANDS, type Chronology, type GraphLayout } from '@/lib/graph-layout';

interface Props {
  entities: Entity[];
  relations: Relation[];
  focus: string;
  anchor?: string;
  trail: string[];
  chronology: Chronology;
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

function frame(instance: Core, positions: Map<string, Position>) {
  let zoom = Math.min(instance.zoom(), 1.1);
  // Fit the destination positions, including labels whose legibility is kept in screen pixels.
  for (let i = 0; i < 6; i++) {
    scaleLabels(instance, zoom);
    let halfWidth = 80;
    let halfHeight = 70;
    for (const node of instance.nodes().not('.leaving')) {
      const point = positions.get(node.id());
      if (!point) continue;
      const bounds = node.boundingBox({ includeLabels: true, includeOverlays: false });
      const current = node.position();
      halfWidth = Math.max(halfWidth, Math.abs(point.x + bounds.x1 - current.x), Math.abs(point.x + bounds.x2 - current.x));
      halfHeight = Math.max(halfHeight, Math.abs(point.y + bounds.y1 - current.y), Math.abs(point.y + bounds.y2 - current.y));
    }
    zoom = Math.max(.02, Math.min((instance.width() - 40) / (halfWidth * 2), (instance.height() - 64) / (halfHeight * 2), 1.1));
  }
  scaleLabels(instance);
  return { zoom, pan: { x: instance.width() / 2, y: instance.height() / 2 } };
}

function markSelection(instance: Core, { selected, selectedEdge, compare }: Props) {
  instance.elements().removeClass('active compared');
  instance.getElementById(selected).addClass('active');
  if (selectedEdge) instance.getElementById(selectedEdge).addClass('active');
  if (compare) instance.getElementById(compare).addClass('compared');
  scaleLabels(instance);
}

function scaleLabels(instance: Core, zoom = instance.zoom()) {
  instance.batch(() => {
    const overview = zoom < .55;
    instance.nodes().toggleClass('compact-labels', overview).removeStyle('font-size');
    const dated = instance.nodes().filter(node => typeof node.data('timeBand') === 'number');
    const sparseDates = instance.width() >= 500 && dated.length <= 3 ? dated : instance.collection();
    sparseDates.removeClass('compact-labels');
    instance.nodes().removeStyle('text-max-width');
    const readable = !overview && instance.width() >= 500 && instance.nodes().length <= 28;
    const revealed = readable ? instance.nodes() : instance.nodes('.root, .active, .hover').union(sparseDates);
    revealed.style('font-size', Math.max(14, 12 / zoom)).style('text-max-width', Math.max(115, 110 / zoom));
    instance.nodes('.root').style('width', Math.max(76, 36 / zoom)).style('height', Math.max(76, 36 / zoom));
  });
}

function syncGuides(svg: SVGSVGElement | null, instance: Core) {
  const pan = instance.pan();
  svg?.firstElementChild?.setAttribute('transform', `translate(${pan.x} ${pan.y}) scale(${instance.zoom()})`);
}

function drawGuides(svg: SVGSVGElement | null, layout: GraphLayout, instance: Core) {
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  const group = document.createElementNS(ns, 'g');
  for (const ring of layout.rings) {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('r', String(ring.radius));
    circle.setAttribute('class', `guide-ring band-${ring.band}`);
    group.append(circle);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', '8');
    label.setAttribute('y', String(-ring.radius + 22));
    label.textContent = TIME_BANDS[ring.band];
    group.append(label);
  }
  if (layout.unknownBox) {
    const box = document.createElementNS(ns, 'rect');
    for (const [key, value] of Object.entries(layout.unknownBox)) box.setAttribute(key, String(value));
    box.setAttribute('rx', '14');
    box.setAttribute('class', 'guide-unknown');
    group.append(box);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(layout.unknownBox.x + 15));
    label.setAttribute('y', String(layout.unknownBox.y + 26));
    label.textContent = 'Dates inconnues · hors échelle';
    group.append(label);
  }
  svg.replaceChildren(group);
  syncGuides(svg, instance);
}

// Reconcile by identity so the previous center and its factual links survive a pivot.
function updateScene(instance: Core, props: Props, animate: boolean, guides: SVGSVGElement | null) {
  const { entities, relations, focus } = props;
  const mobile = instance.width() < 500;
  const layout = layoutGraph(props, focus, props.trail, props.chronology);
  const positions = layout.positions;
  drawGuides(guides, layout, instance);
  const origin = { ...(instance.getElementById(focus).position() ?? { x: 0, y: 0 }) };
  const ids = new Set([...entities, ...relations].map(item => item.id));
  const leaving = instance.elements().filter(element => !ids.has(element.id()));
  const entering = new Set<string>();
  const duration = 620;
  const motion = animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  instance.batch(() => {
    instance.elements().removeStyle('opacity').removeClass('leaving');
    for (const entity of entities) {
      const point = positions.get(entity.id)!;
      const isFocus = entity.id === focus;
      const location = layout.unknownIds.includes(entity.id) ? 'unknown-date' : layout.historyIds.includes(entity.id) ? 'history-node' : Math.abs(point.x) > 180 ? (point.x < 0 ? 'label-left' : 'label-right') : point.y < 0 ? 'label-top' : '';
      const label = entity.label.length > 65 && entity.abbreviatedLabel ? entity.abbreviatedLabel : shortLabel(entity);
      const data = { id: entity.id, label: label.replace('président ou présidente', 'président').replace('Président ou présidente', 'Président'), color: typeInfo[entity.type].color, soft: typeInfo[entity.type].soft, badge: badge(entity, isFocus), size: mobile ? 60 : 47, fontSize: mobile ? 16 : 12, timeBand: layout.historyIds.includes(entity.id) ? 'history' : props.chronology.nodes.get(entity.id)?.band ?? 'unknown' };
      let node = instance.getElementById(entity.id);
      if (!node.length) {
        node = instance.add({ group: 'nodes', data, position: { ...(motion ? origin : point) } });
        entering.add(entity.id);
      } else node.data(data);
      node.removeStyle('width height').classes(isFocus ? 'root' : location);
      if (!motion) node.position(point);
    }
    for (const relation of relations) {
      if (!instance.getElementById(relation.id).length) {
        instance.add({ group: 'edges', classes: layout.unknownIds.includes(relation.source) || layout.unknownIds.includes(relation.target) ? 'undated-edge' : '', data: { id: relation.id, source: relation.source, target: relation.target, color: categoryInfo[relation.category].color, label: categoryInfo[relation.category].singular } });
        entering.add(relation.id);
      }
      instance.getElementById(relation.id).toggleClass('undated-edge', layout.unknownIds.includes(relation.source) || layout.unknownIds.includes(relation.target));
    }
    markSelection(instance, props);
    if (!motion) leaving.remove();
    else {
      leaving.addClass('leaving');
      for (const id of entering) instance.getElementById(id).style('opacity', 0);
    }
  });
  if (!motion) {
    instance.viewport(frame(instance, positions));
    return () => {};
  }
  for (const [id, position] of positions) {
    instance.getElementById(id).animate({ position, ...(entering.has(id) ? { style: { opacity: 1 } } : {}) }, { duration, easing: 'ease-in-out-cubic', queue: false });
  }
  for (const id of entering) {
    const element = instance.getElementById(id);
    if (element.isEdge()) element.animate({ style: { opacity: element.hasClass('active') ? 1 : .42 } }, { duration, queue: false });
  }
  leaving.animate({ style: { opacity: 0 } }, { duration: 180, queue: false });
  instance.animate(frame(instance, positions), { duration, easing: 'ease-in-out-cubic', queue: false });
  const removal = window.setTimeout(() => leaving.remove(), 200);
  const finish = window.setTimeout(() => instance.elements().removeStyle('opacity'), duration + 50);
  return () => {
    window.clearTimeout(removal);
    window.clearTimeout(finish);
    instance.stop(true, false);
    instance.elements().stop(true, false);
  };
}

export function GraphCanvas(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const guides = useRef<SVGSVGElement>(null);
  const cy = useRef<Core | null>(null);
  const callbacks = useRef(props);
  const refresh = useRef<(animate?: boolean, overview?: boolean) => void>(() => {});
  const [ready, setReady] = useState(false);
  useEffect(() => { callbacks.current = props; });
  const { entities, relations, focus, anchor, selected, selectedEdge, compare, chronology, trail } = props;

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let cancelTransition = () => {};
    import('cytoscape').then(({ default: cytoscape }) => {
      if (disposed || !container.current) return;
      const instance = cytoscape({
        container: container.current,
        elements: [],
        layout: { name: 'preset', fit: false },
        minZoom: 0.02, maxZoom: 2.8, wheelSensitivity: 0.22,
        style: [
          { selector: 'node', style: { width: 'data(size)', height: 'data(size)', 'background-color': 'data(soft)', 'background-image': 'data(badge)', 'background-width': '76%', 'background-height': '76%', 'border-width': 1.2, 'border-color': 'data(color)', label: 'data(label)', 'font-family': 'Arial, sans-serif', 'font-size': 'data(fontSize)', color: '#343d38', 'text-valign': 'bottom', 'text-margin-y': 10, 'text-wrap': 'wrap', 'text-max-width': '115px', 'text-background-color': '#fafbf8', 'text-background-opacity': 0.93, 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle', 'overlay-opacity': 0 } },
          { selector: 'node.label-left', style: { 'text-halign': 'left', 'text-valign': 'center', 'text-margin-x': -11, 'text-margin-y': 0 } },
          { selector: 'node.label-right', style: { 'text-halign': 'right', 'text-valign': 'center', 'text-margin-x': 11, 'text-margin-y': 0 } },
          { selector: 'node.label-top', style: { 'text-valign': 'top', 'text-margin-y': -11 } },
          { selector: 'node.root', style: { width: 76, height: 76, 'background-color': '#254d40', 'border-color': '#254d40', 'border-width': 4, 'font-size': 14, 'font-weight': 'bold', 'text-margin-y': 12 } },
          { selector: 'node.active', style: { 'border-width': 3, 'border-color': '#254d40', 'underlay-color': '#254d40', 'underlay-opacity': 0.07, 'underlay-padding': 8 } },
          { selector: 'node.root.active', style: { 'underlay-opacity': 0, 'text-max-width': '180px', 'font-size': 15 } },
          { selector: 'node.compared', style: { 'border-width': 3, 'border-color': '#a47947', 'underlay-color': '#a47947', 'underlay-opacity': 0.08, 'underlay-padding': 8 } },
          { selector: 'edge', style: { width: 1.1, 'line-color': 'data(color)', opacity: 0.42, 'curve-style': 'bezier', 'control-point-step-size': 24, 'overlay-padding': 9, 'overlay-opacity': 0 } },
          { selector: 'edge.hover, edge.active', style: { width: 2.2, opacity: 1, label: 'data(label)', 'font-size': 10, 'text-rotation': 'autorotate', color: '#34463d', 'text-background-color': '#fafbf8', 'text-background-opacity': 1, 'text-background-padding': '4px' } },
          { selector: 'node.unknown-date', style: { 'border-style': 'dashed' } },
          { selector: 'node.compact-labels', style: { 'text-opacity': 0 } },
          { selector: 'node.root, node.active, node.hover', style: { 'text-opacity': 1 } },
          { selector: 'edge.undated-edge', style: { opacity: .17, 'line-style': 'dashed' } },
          { selector: 'edge.active, edge.hover', style: { opacity: 1 } },
          { selector: '.leaving', style: { events: 'no' } },
        ],
      });
      cy.current = instance;
      instance.on('tap', 'node', event => callbacks.current.onSelect(event.target.id()));
      instance.on('dbltap', 'node', event => callbacks.current.onExpand(event.target.id()));
      instance.on('tap', 'edge', event => callbacks.current.onEdge(event.target.id()));
      instance.on('mouseover', 'edge', event => { event.target.addClass('hover'); if (container.current) container.current.style.cursor = 'pointer'; });
      instance.on('mouseout', 'edge', event => { event.target.removeClass('hover'); if (container.current) container.current.style.cursor = 'grab'; });
      instance.on('mouseover', 'node', event => { event.target.addClass('hover'); scaleLabels(instance); if (container.current) container.current.style.cursor = 'pointer'; });
      instance.on('mouseout', 'node', event => { event.target.removeClass('hover'); scaleLabels(instance); if (container.current) container.current.style.cursor = 'grab'; });
      instance.on('pan zoom', () => { syncGuides(guides.current, instance); scaleLabels(instance); });
      cancelTransition = updateScene(instance, callbacks.current, false, guides.current);
      refresh.current = (animate = true, overview = false) => {
        cancelTransition();
        cancelTransition = updateScene(instance, callbacks.current, animate, guides.current);
        if (overview) {
          const positions = layoutGraph(callbacks.current, callbacks.current.focus, callbacks.current.trail, callbacks.current.chronology).positions;
          instance.viewport(frame(instance, positions));
        }
      };
      let width = container.current.clientWidth;
      let height = container.current.clientHeight;
      observer = new ResizeObserver(() => {
        if (!container.current || (width === container.current.clientWidth && height === container.current.clientHeight)) return;
        width = container.current.clientWidth;
        height = container.current.clientHeight;
        const moving = instance.animated() || instance.nodes().filter(':animated').length > 0;
        cancelTransition();
        instance.resize();
        cancelTransition = updateScene(instance, callbacks.current, moving, guides.current);
      });
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!disposed) callbacks.current.onFallback(); });
    return () => { disposed = true; observer?.disconnect(); cancelTransition(); refresh.current = () => {}; cy.current?.destroy(); cy.current = null; };
  }, []);

  useEffect(() => { refresh.current(); }, [entities, relations, focus, anchor, chronology, trail]);

  useEffect(() => {
    if (cy.current) markSelection(cy.current, callbacks.current);
  }, [selected, selectedEdge, compare]);

  return <div className="graph-stage" data-testid="graph-stage" data-ready={ready}>
    <svg className="graph-guides" ref={guides} aria-hidden="true" />
    <div className="graph-canvas" ref={container} role="img" aria-label={`Graphe de ${entities.length} entités et ${relations.length} relations. Utilisez le mode Liste pour explorer au clavier.`} />
    <div className="graph-compass" aria-hidden="true"><span>N</span><i /><small>VUE RELATIONNELLE</small></div>
    <div className="graph-controls" aria-label="Contrôles du graphe">
      <button className="icon-button" aria-label="Zoom avant" onClick={() => cy.current?.zoom({ level: cy.current.zoom() * 1.25, renderedPosition: { x: (container.current?.clientWidth ?? 0) / 2, y: (container.current?.clientHeight ?? 0) / 2 } })}><Plus size={18} /></button>
      <button className="icon-button" aria-label="Zoom arrière" onClick={() => cy.current?.zoom({ level: cy.current.zoom() / 1.25, renderedPosition: { x: (container.current?.clientWidth ?? 0) / 2, y: (container.current?.clientHeight ?? 0) / 2 } })}><Minus size={18} /></button>
      <span /><button className="icon-button" aria-label="Recentrer le graphe" onClick={() => refresh.current(false, true)}><Maximize size={17} /></button>
    </div>
    <p className="graph-tip"><MousePointer2 size={13} /><span className="desktop-tip">{entities.length > 28 ? 'Zoomez pour lire les noms. Un clic ouvre la fiche.' : 'Un clic pour comprendre. Deux pour explorer.'}</span><span className="mobile-tip">Glissez ou zoomez pour explorer.</span></p>
  </div>;
}
