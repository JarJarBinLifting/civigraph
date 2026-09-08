'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { Download, Maximize, Minus, Plus, MousePointer2 } from 'lucide-react';
import type { Core, NodeSingular, SingularElementArgument } from 'cytoscape';
import { categoryInfo, shortLabel, typeInfo } from '@/lib/presentation';
import { atlasLabelStyle, atlasNodeStyles, graphFont, nodeShape, nodeSymbol } from '@/lib/graph-theme';
import { graphMotion, graphMotionEnabled, graphNodeAppearance, quietNodeStyles } from '@/lib/graph-appearance';
import { labelLevel, placeLabels, type LabelCandidate, type LabelLevel } from '@/lib/graph-labels';
import type { Entity, Relation } from '@/lib/types';
import { TIME_BANDS, type Chronology, type GraphLayout } from '@/lib/graph-layout';
import { frameGraph, layoutInViewport, nodeDiameter } from '@/lib/graph-viewport';
import type { GraphExportInfo } from '@/lib/graph-export';
import type { GraphCamera } from '@/lib/system-graph';

interface Props {
  camera?: RefObject<GraphCamera | undefined>;
  enlarged?: boolean;
  entities: Entity[];
  relations: Relation[];
  focus: string;
  anchor?: string;
  trail: string[];
  chronology: Chronology;
  selected: string;
  selectedEdge: string | null;
  compare: string | null;
  exportInfo: GraphExportInfo;
  onSelect: (id: string) => void;
  onEdge: (id: string) => void;
  onExpand: (id: string) => void;
  onFallback: () => void;
}

function cameraKey(props: Props) {
  return JSON.stringify([props.focus, props.trail, props.entities.map(e => e.id), props.relations.map(r => r.id), props.chronology.reference]);
}

function layoutFor(props: Props, instance: Core) {
  return layoutInViewport(props, props.focus, props.trail, props.chronology, instance.width(), instance.height());
}

function frame(instance: Core, layout: GraphLayout) {
  return frameGraph(layout, instance.width(), instance.height());
}

function markSelection(instance: Core, { selected, selectedEdge, compare }: Props, hovered?: SingularElementArgument) {
  instance.elements().removeClass('active compared inspected-neighbor dimmed edge-endpoint');
  instance.getElementById(selected).addClass('active');
  if (selectedEdge) instance.getElementById(selectedEdge).addClass('active');
  if (compare) instance.getElementById(compare).addClass('compared');
  const inspected = hovered ?? (selectedEdge ? instance.getElementById(selectedEdge) : instance.getElementById(selected));
  inspected.edges().connectedNodes().addClass('edge-endpoint');
  if (inspected.length && (!inspected.hasClass('root') || selectedEdge)) {
    const neighborhood = instance.collection().union(inspected).union(inspected.nodes().closedNeighborhood()).union(inspected.edges().connectedNodes());
    neighborhood.addClass('inspected-neighbor');
    instance.elements().difference(neighborhood).addClass('dimmed');
  }
  scaleLabels(instance);
}

const labelStates = new WeakMap<Core, { level: LabelLevel; previous: Set<string>; widths: Map<string, number>; context: CanvasRenderingContext2D | null }>();
function styleChanged(element: SingularElementArgument, styles: Record<string, string | number>) {
  const before = element.scratch('atlasStyle') ?? {};
  const changed = Object.fromEntries(Object.entries(styles).filter(([key, value]) => before[key] !== value));
  if (Object.keys(changed).length) { element.style(changed); element.scratch('atlasStyle', { ...before, ...changed }); }
}

function scaleLabels(instance: Core, zoom = instance.zoom()) {
  let state = labelStates.get(instance);
  if (!state) { state = { level: 0, previous: new Set(), widths: new Map(), context: document.createElement('canvas').getContext('2d') }; labelStates.set(instance, state); }
  state.level = labelLevel(zoom, state.level);
  const current = state;
  const measure = (text: string, size: number, bold: boolean) => {
    const key = `${size}:${bold}:${text}`;
    if (!current.widths.has(key)) {
      if (current.context) current.context.font = `${bold ? 600 : 500} ${size}px ${graphFont}`;
      current.widths.set(key, current.context?.measureText(text).width ?? text.length * size * .55);
    }
    return current.widths.get(key)!;
  };
  const svg = instance.scratch('atlasGuides') as SVGSVGElement | null;
  sizeGuides(svg, instance, zoom);
  const obstacles = Array.from(svg?.querySelectorAll('text') ?? []).map(label => {
    const box = label.getBBox();
    return { x1: box.x * zoom - 3, x2: (box.x + box.width) * zoom + 3, y1: box.y * zoom - 3, y2: (box.y + box.height) * zoom + 3 };
  });
  instance.batch(() => {
    const sceneNodes = instance.nodes().not('.leaving');
    const prominent = sceneNodes.length <= 28 && instance.width() >= 560;
    const compact = instance.width() < 900;
    const candidates: LabelCandidate[] = sceneNodes.map(node => {
      const priority = node.hasClass('root') ? 100 : node.hasClass('active') ? 90 : node.hasClass('hover') ? 80 : node.hasClass('edge-endpoint') ? 75 : node.hasClass('compared') ? 70 : node.hasClass('history-node') ? 60 : node.hasClass('inspected-neighbor') ? 20 : 0;
      const position = (node as NodeSingular).position();
      const diameter = nodeDiameter(zoom, prominent, node.hasClass('root'), priority, compact) * (node.data('type') === 'person' || node.hasClass('root') ? 1 : 1.12);
      styleChanged(node, { width: diameter / zoom, height: diameter / zoom, 'border-width': (priority >= 60 ? 2 : 1.2) / zoom });
      const side = node.hasClass('unknown-date') && node.data('type') === 'office' ? 'right'
        : node.hasClass('unknown-date') && node.data('type') === 'organization' ? 'left'
        : node.hasClass('root') || node.hasClass('unknown-date') || node.hasClass('history-node') ? 'bottom'
        : Math.abs(position.x) > Math.abs(position.y) ? position.x < 0 ? 'left' : 'right' : position.y < 0 ? 'top' : 'bottom';
      return { id: node.id(), text: node.data('label'), x: position.x * zoom, y: position.y * zoom, radius: diameter / 2, priority, side };
    });
    const pan = instance.pan();
    const placements = placeLabels(candidates, { level: state.level, previous: state.previous, small: instance.width() < 500, compact, prominent, measure, obstacles, viewport: { x1: 6 - pan.x, x2: instance.width() - pan.x - 6, y1: 6 - pan.y, y2: instance.height() - pan.y - 6 } });
    const byId = new Map(placements.map(label => [label.id, label]));
    for (const node of sceneNodes) {
      const label = byId.get(node.id());
      styleChanged(node, atlasLabelStyle(label, zoom, node.is('.root, .active, .hover, .history-node, .edge-endpoint')));
    }
    state.previous = new Set(byId.keys());
    for (const edge of instance.edges()) styleChanged(edge, { width: (edge.hasClass('active') || edge.hasClass('hover') ? 1.8 : edge.hasClass('inspected-neighbor') ? 1.15 : prominent ? .85 : .6) / zoom, 'font-size': 14 / zoom, 'text-background-padding': 3 / zoom });
  });
}

function syncGuides(svg: SVGSVGElement | null, instance: Core) {
  const pan = instance.pan();
  svg?.firstElementChild?.setAttribute('transform', `translate(${pan.x} ${pan.y}) scale(${instance.zoom()})`);
}

function sizeGuides(svg: SVGSVGElement | null, instance: Core, zoom = instance.zoom()) {
  svg?.querySelectorAll('text').forEach(label => {
    label.style.fontSize = `${13 / zoom}px`;
    if (label.dataset.offsetY) label.setAttribute('y', String(Number(label.dataset.anchorY) - Number(label.dataset.offsetY) / zoom));
    if (label.dataset.full) {
      const shortened = instance.width() < 560 || label.dataset.sector === 'organization' && instance.width() < 900;
      label.textContent = shortened ? label.dataset.short! : label.dataset.full;
    }
    if (label.dataset.anchorX) {
      const anchor = Number(label.dataset.anchorX), screenX = anchor * zoom + instance.pan().x;
      label.setAttribute('x', String(anchor));
      if (screenX >= 0 && screenX <= instance.width()) {
        const half = label.getBBox().width * zoom / 2;
        const clamped = Math.max(half + 6, Math.min(screenX, instance.width() - half - 6));
        label.setAttribute('x', String((clamped - instance.pan().x) / zoom));
      }
    }
  });
  svg?.querySelectorAll<SVGTextElement>('.guide-history-label').forEach(label => label.setAttribute('y', String(Number(label.dataset.anchorY) - 64 / zoom)));
}

function drawGuides(svg: SVGSVGElement | null, layout: GraphLayout, instance: Core) {
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  const group = document.createElementNS(ns, 'g');
  for (const ring of layout.rings) {
    const circle = document.createElementNS(ns, 'ellipse');
    circle.setAttribute('rx', String(ring.radius * layout.xScale));
    circle.setAttribute('ry', String(ring.radius));
    circle.setAttribute('class', `guide-ring band-${ring.band}`);
    group.append(circle);
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(-ring.radius * layout.xScale / Math.SQRT2 - 8));
    label.setAttribute('y', String(-ring.radius / Math.SQRT2));
    label.setAttribute('text-anchor', 'middle');
    label.textContent = TIME_BANDS[ring.band];
    group.append(label);
  }
  for (const zone of layout.unknownZones) {
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('class', 'guide-unknown-label');
    label.setAttribute('x', String(zone.x + zone.width / 2));
    label.setAttribute('y', String(zone.y - 16));
    label.setAttribute('text-anchor', 'middle');
    label.textContent = 'Dates inconnues · hors échelle';
    label.dataset.full = label.textContent; label.dataset.short = 'Sans dates · hors échelle';
    label.dataset.anchorX = String(zone.x + zone.width / 2);
    label.dataset.anchorY = String(zone.type === 'party' ? zone.y + zone.height : zone.y);
    label.dataset.offsetY = zone.type === 'party' ? '-28' : '10';
    group.append(label);
  }
  for (const sector of layout.sectors) {
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(sector.x)); label.setAttribute('y', String(sector.y));
    label.setAttribute('text-anchor', 'middle'); label.setAttribute('class', 'guide-sector-label');
    label.style.fill = typeInfo[sector.type].color; label.style.fontWeight = 'bold';
    label.textContent = sector.label; label.dataset.full = sector.label;
    label.dataset.sector = sector.type;
    label.dataset.short = { school: 'Formations', office: 'Fonctions', organization: 'Organisations', party: 'Affiliations', person: 'Personnalités' }[sector.type];
    label.dataset.anchorX = String(sector.x); group.append(label);
    const unknown = layout.unknownZones.find(zone => zone.type === sector.type);
    if (unknown) {
      label.dataset.anchorY = String(sector.type === 'party' ? unknown.y + unknown.height : unknown.y);
      label.dataset.offsetY = sector.type === 'party' ? '-8' : '30';
    }
  }
  if (layout.historyIds.length) {
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('class', 'guide-history-label');
    label.setAttribute('x', String(Math.min(...layout.historyIds.map(id => layout.positions.get(id)!.x))));
    label.dataset.anchorY = String(layout.positions.get(layout.historyIds[0])!.y);
    label.textContent = 'Parcours exploré';
    group.append(label);
  }
  svg.replaceChildren(group);
  syncGuides(svg, instance);
  sizeGuides(svg, instance);
}

// Reconcile by identity so the previous center and its factual links survive a pivot.
function updateScene(instance: Core, props: Props, animate: boolean, guides: SVGSVGElement | null) {
  const { entities, relations, focus } = props;
  const mobile = instance.width() < 500;
  const layout = layoutFor(props, instance);
  instance.scratch('atlasLayout', layout);
  const positions = layout.positions;
  drawGuides(guides, layout, instance);
  const origin = { ...(instance.getElementById(focus).position() ?? { x: 0, y: 0 }) };
  const ids = new Set([...entities, ...relations].map(item => item.id));
  const leaving = instance.elements().filter(element => !ids.has(element.id()));
  const entering = new Set<string>();
  const duration = graphMotion.scene;
  const motion = animate && graphMotionEnabled();
  instance.batch(() => {
    instance.elements().removeStyle('opacity').removeClass('leaving');
    for (const entity of entities) {
      const point = positions.get(entity.id)!;
      const isFocus = entity.id === focus;
      const location = layout.unknownIds.includes(entity.id) ? 'unknown-date' : layout.historyIds.includes(entity.id) ? 'history-node' : Math.abs(point.x) > 180 ? (point.x < 0 ? 'label-left' : 'label-right') : point.y < 0 ? 'label-top' : '';
      const label = entity.label.length > 65 && entity.abbreviatedLabel ? entity.abbreviatedLabel : shortLabel(entity);
      const data = { id: entity.id, ...graphNodeAppearance(entity.type), label: label.replace('président ou présidente', 'président').replace('Président ou présidente', 'Président'), shape: nodeShape(entity), badge: nodeSymbol(entity, isFocus), quietBadge: nodeSymbol(entity, isFocus, typeInfo[entity.type].color), size: mobile ? 60 : 47, fontSize: mobile ? 16 : 12, timeBand: layout.historyIds.includes(entity.id) ? 'history' : props.chronology.nodes.get(entity.id)?.band ?? 'unknown' };
      let node = instance.getElementById(entity.id);
      if (!node.length) {
        node = instance.add({ group: 'nodes', data, position: { ...(motion ? origin : point) } });
        entering.add(entity.id);
      } else node.data(data);
      node.classes(isFocus ? 'root' : location);
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
    instance.viewport(frame(instance, layout));
    scaleLabels(instance);
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
  instance.animate(frame(instance, layout), { duration, easing: 'ease-in-out-cubic', queue: false });
  const removal = window.setTimeout(() => leaving.remove(), 200);
  const finish = window.setTimeout(() => { instance.elements().removeStyle('opacity'); scaleLabels(instance); }, duration + 50);
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
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function download() {
    if (!cy.current || !guides.current || exporting) return;
    const instance = cy.current, svg = guides.current;
    setExporting(true); setExportMessage('');
    try {
      const { exportGraphPng } = await import('@/lib/export-png');
      if (!mounted.current || instance.destroyed()) return;
      await exportGraphPng(instance, svg, callbacks.current.exportInfo);
      if (mounted.current) setExportMessage('PNG exporté avec le contexte et la référence de la vue.');
    } catch (error) { if (mounted.current) setExportMessage(error instanceof Error ? error.message : 'L’export PNG a échoué.'); }
    finally { if (mounted.current) setExporting(false); }
  }
  useEffect(() => { callbacks.current = props; });
  const { entities, relations, focus, anchor, selected, selectedEdge, compare, chronology, trail } = props;

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let cancelTransition = () => {};
    let zoomFrame = 0;
    let panTimer = 0;
    Promise.all([import('cytoscape'), document.fonts.load(`500 16px ${graphFont}`), document.fonts.load(`600 16px ${graphFont}`)]).then(([{ default: cytoscape }]) => {
      if (disposed || !container.current) return;
      const instance = cytoscape({
        container: container.current,
        elements: [],
        layout: { name: 'preset', fit: false },
        minZoom: 0.02, maxZoom: 2.8, wheelSensitivity: 0.8,
        style: [
          { selector: 'node', style: { width: 'data(size)', height: 'data(size)', 'background-color': 'data(soft)', 'background-image': 'data(badge)', 'background-width': '76%', 'background-height': '76%', 'border-width': 1.2, 'border-color': 'data(color)', label: 'data(label)', 'font-family': graphFont, 'font-size': 'data(fontSize)', color: '#102a50', 'text-valign': 'bottom', 'text-margin-y': 10, 'text-wrap': 'wrap', 'text-max-width': '115px', 'text-background-color': '#ffffff', 'text-background-opacity': 0.93, 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle', 'overlay-opacity': 0 } },
          { selector: 'node.label-left', style: { 'text-halign': 'left', 'text-valign': 'center', 'text-margin-x': -11, 'text-margin-y': 0 } },
          { selector: 'node.label-right', style: { 'text-halign': 'right', 'text-valign': 'center', 'text-margin-x': 11, 'text-margin-y': 0 } },
          { selector: 'node.label-top', style: { 'text-valign': 'top', 'text-margin-y': -11 } },
          { selector: 'node.root', style: { width: 76, height: 76, 'background-color': '#083577', 'border-color': '#083577', 'border-width': 4, 'font-size': 14, 'font-weight': 'bold', 'text-margin-y': 12 } },
          { selector: 'node.active', style: { 'border-width': 3, 'border-color': '#083577', 'underlay-color': '#083577', 'underlay-opacity': 0.07, 'underlay-padding': 8 } },
          { selector: 'node.root.active', style: { 'underlay-opacity': 0, 'text-max-width': '180px', 'font-size': 15 } },
          { selector: 'node.compared', style: { 'border-width': 3, 'border-color': '#a47947', 'underlay-color': '#a47947', 'underlay-opacity': 0.08, 'underlay-padding': 8 } },
          { selector: 'edge', style: { width: .9, 'line-color': '#99aabc', opacity: .48, 'curve-style': 'bezier', 'control-point-step-size': 22, 'overlay-padding': 5, 'overlay-opacity': 0 } },
          { selector: 'edge.hover, edge.active', style: { width: 2.2, opacity: 1, label: 'data(label)', 'font-size': 10, 'text-rotation': 'autorotate', color: '#102a50', 'text-background-color': '#ffffff', 'text-background-opacity': 1, 'text-background-padding': '4px' } },
          { selector: 'edge.active, edge.hover', style: { opacity: 1 } },
          { selector: 'node.dimmed', style: { opacity: .6 } },
          { selector: 'edge.dimmed', style: { opacity: .14 } },
          { selector: 'edge.inspected-neighbor', style: { 'line-color': 'data(color)', opacity: .72, width: 1.3 } },
          { selector: 'node.root.dimmed, node.history-node.dimmed', style: { opacity: .9 } },
          { selector: '.leaving', style: { events: 'no' } },
          ...atlasNodeStyles,
          ...quietNodeStyles,
          { selector: 'edge.active, edge.hover', style: { 'line-color': '#083577', width: 2, opacity: 1 } },
          { selector: 'node', style: { 'line-height': 1.2 } },
          { selector: 'node.active.dimmed, node.hover.dimmed', style: { opacity: 1 } },
        ],
      });
      cy.current = instance;
      instance.scratch('atlasGuides', guides.current);
      instance.on('tap', 'node', event => callbacks.current.onSelect(event.target.id()));
      instance.on('dbltap', 'node', event => callbacks.current.onExpand(event.target.id()));
      instance.on('tap', 'edge', event => callbacks.current.onEdge(event.target.id()));
      instance.on('mouseover', 'node, edge', event => { event.target.addClass('hover'); markSelection(instance, callbacks.current, event.target); if (container.current) container.current.style.cursor = 'pointer'; });
      instance.on('mouseout', 'node, edge', event => { event.target.removeClass('hover'); markSelection(instance, callbacks.current); if (container.current) container.current.style.cursor = 'grab'; });
      instance.on('pan', () => {
        syncGuides(guides.current, instance);
        window.clearTimeout(panTimer);
        panTimer = window.setTimeout(() => { if (!disposed) scaleLabels(instance); }, 100);
      });
      instance.on('zoom', () => {
        syncGuides(guides.current, instance);
        if (!zoomFrame) zoomFrame = requestAnimationFrame(() => { zoomFrame = 0; if (!disposed) scaleLabels(instance); });
      });
      cancelTransition = updateScene(instance, callbacks.current, false, guides.current);
      const savedCamera = callbacks.current.camera?.current;
      if (savedCamera?.key === cameraKey(callbacks.current)) {
        instance.viewport({ zoom: savedCamera.zoom, pan: { x: instance.width() / 2 - savedCamera.x * savedCamera.zoom, y: instance.height() / 2 - savedCamera.y * savedCamera.zoom } });
        scaleLabels(instance);
      }
      refresh.current = (animate = true, overview = false) => {
        cancelTransition();
        cancelTransition = updateScene(instance, callbacks.current, animate, guides.current);
        if (overview) {
          const layout = layoutFor(callbacks.current, instance);
          instance.viewport(frame(instance, layout));
        }
      };
      let width = container.current.clientWidth;
      let height = container.current.clientHeight;
      let wasEnlarged = Boolean(callbacks.current.enlarged);
      let previousCamera: { zoom: number; x: number; y: number; focus: string } | undefined;
      observer = new ResizeObserver(() => {
        if (!container.current || (width === container.current.clientWidth && height === container.current.clientHeight)) return;
        const previousLayout = instance.scratch('atlasLayout') as GraphLayout;
        const overview = frameGraph(previousLayout, width, height);
        const wasOverview = Math.abs(instance.zoom() / overview.zoom - 1) < .01
          && Math.hypot(instance.pan().x - overview.pan.x, instance.pan().y - overview.pan.y) < 2;
        const enlarged = Boolean(callbacks.current.enlarged);
        const changedMode = enlarged !== wasEnlarged;
        if (changedMode && enlarged) previousCamera = { zoom: instance.zoom(), x: (width / 2 - instance.pan().x) / instance.zoom(), y: (height / 2 - instance.pan().y) / instance.zoom(), focus: callbacks.current.focus };
        const dx = (container.current.clientWidth - width) / 2, dy = (container.current.clientHeight - height) / 2;
        width = container.current.clientWidth;
        height = container.current.clientHeight;
        const moving = instance.animated() || instance.nodes().filter(':animated').length > 0;
        instance.resize();
        if (changedMode) {
          cancelTransition();
          cancelTransition = updateScene(instance, callbacks.current, false, guides.current);
          if (!enlarged && previousCamera?.focus === callbacks.current.focus) {
            const camera = previousCamera;
            instance.viewport({ zoom: camera.zoom, pan: { x: width / 2 - camera.x * camera.zoom, y: height / 2 - camera.y * camera.zoom } });
          } else instance.viewport(frame(instance, layoutFor(callbacks.current, instance)));
          scaleLabels(instance);
        }
        else if (moving || wasOverview) { cancelTransition(); cancelTransition = updateScene(instance, callbacks.current, moving, guides.current); }
        else { instance.panBy({ x: dx, y: dy }); scaleLabels(instance); }
        wasEnlarged = enlarged;
      });
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!disposed) callbacks.current.onFallback(); });
    return () => {
      disposed = true; observer?.disconnect(); cancelAnimationFrame(zoomFrame); window.clearTimeout(panTimer); cancelTransition(); refresh.current = () => {};
      const instance = cy.current, camera = callbacks.current.camera;
      if (instance && camera) camera.current = { key: cameraKey(callbacks.current), zoom: instance.zoom(), x: (instance.width() / 2 - instance.pan().x) / instance.zoom(), y: (instance.height() / 2 - instance.pan().y) / instance.zoom() };
      instance?.destroy(); cy.current = null;
    };
  }, []);

  useEffect(() => { refresh.current(); }, [entities, relations, focus, anchor, chronology, trail]);

  useEffect(() => {
    if (cy.current) markSelection(cy.current, callbacks.current);
  }, [selected, selectedEdge, compare]);

  return <div className="graph-stage" data-testid="graph-stage" data-ready={ready}>
    <svg className="graph-guides" ref={guides} aria-hidden="true" />
    <div className="graph-canvas" ref={container} role="img" aria-label={`Graphe de ${entities.length} entités et ${relations.length} relations. Utilisez le mode Liste pour explorer au clavier.`} />
    <div className="graph-controls" aria-label="Contrôles du graphe">
      <button className="icon-button" aria-label="Zoom avant" onClick={() => cy.current?.zoom({ level: Math.min(cy.current.maxZoom(), cy.current.zoom() * 2), renderedPosition: { x: (container.current?.clientWidth ?? 0) / 2, y: (container.current?.clientHeight ?? 0) / 2 } })}><Plus size={18} /></button>
      <button className="icon-button" aria-label="Zoom arrière" onClick={() => cy.current?.zoom({ level: Math.max(cy.current.minZoom(), cy.current.zoom() / 2), renderedPosition: { x: (container.current?.clientWidth ?? 0) / 2, y: (container.current?.clientHeight ?? 0) / 2 } })}><Minus size={18} /></button>
      <span /><button className="icon-button" aria-label="Recentrer le graphe" onClick={() => refresh.current(false, true)}><Maximize size={17} /></button>
      <span /><button className="icon-button" aria-label="Exporter la carte en PNG" title="Exporter la carte en PNG" disabled={!ready || exporting} onClick={download}><Download size={17} /></button>
    </div>
    {exportMessage && <p className="graph-export-message" role="status">{exportMessage}</p>}
    <p className="graph-tip"><MousePointer2 size={18} /><span className="desktop-tip">{entities.length > 28 ? 'Zoomez pour lire les noms. Cliquez pour voir les liens et leurs sources.' : 'Cliquez sur une entité pour voir ses liens et leurs sources.'}</span><span className="mobile-tip">Touchez une entité pour ouvrir sa fiche.</span></p>
  </div>;
}
