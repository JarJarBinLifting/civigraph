'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Core, NodeSingular } from 'cytoscape';
import { Download, Maximize, Minus, MousePointer2, Plus, ScanSearch, Undo2 } from 'lucide-react';
import { atlasLabelStyle, atlasTheme, graphFont } from '@/lib/graph-theme';
import { placeLabels, type LabelCandidate } from '@/lib/graph-labels';
import { periodLabel, shortLabel, typeInfo } from '@/lib/presentation';
import { matchingSystemPositions, systemGraphKey, systemLayoutInput, systemNeighborhood, type SystemGraph, type SystemGraphMemory, type SystemPositions } from '@/lib/system-graph';
import type { GraphExportInfo } from '@/lib/graph-export';
import { affiliationSymbol, organizeSystem, UNKNOWN_POLITICAL_COLOR, type PoliticalIndex, type System } from '@/lib/system-reading';

interface Props {
  graph: SystemGraph;
  whole: SystemGraph;
  organization: SystemGraph;
  system: System;
  reading: 'groups' | 'individuals';
  politics: PoliticalIndex;
  selected: string | null;
  selectedEdge: string | null;
  focusRequest: { id: string } | null;
  memory: RefObject<SystemGraphMemory>;
  exportInfo: GraphExportInfo;
  onSelect: (id: string) => void;
  onEdge: (id: string) => void;
  onCentered: () => void;
  onFallback: () => void;
  onClear: () => void;
}

export function SystemGraphCanvas(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const latest = useRef(props);
  const refresh = useRef<() => void>(() => {});
  const inspect = useRef<() => void>(() => {});
  const frame = useRef<() => void>(() => {});
  const refine = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [isolated, setIsolated] = useState<string | null>(null);
  const isolatedRef = useRef<string | null>(null);
  const isolationCamera = useRef<{ zoom: number; x: number; y: number } | undefined>(undefined);
  const checkpoint = useRef<() => void>(() => {}), undo = useRef<() => void>(() => {});
  const [canUndo, setCanUndo] = useState(false);
  const navigation = useRef<HTMLSpanElement>(null);
  const miniPoints = useRef<SVGPathElement>(null), miniViewport = useRef<SVGRectElement>(null);
  const [neighborhood, setNeighborhood] = useState<{ selected: string | null; edge: string | null; depth: 1 | 2 }>({ selected: null, edge: null, depth: 1 });
  const depth = neighborhood.selected === props.selected && neighborhood.edge === props.selectedEdge ? neighborhood.depth : 1;
  const depthRef = useRef<1 | 2>(1);
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  useEffect(() => { latest.current = props; });

  useEffect(() => {
    let disposed = false, worker: Worker | undefined, observer: ResizeObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined, settleTimer: ReturnType<typeof setTimeout> | undefined;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined, markFrame = 0, moving = false;
    let hover: string | null = null, currentKey = '', markedKey = '', homeZoom = 1, sizedZoom = 0, sizedSelected: string | null = null;
    // Opening a detail panel does not commit the map to a neighborhood.
    let focused: string | null = null;
    let appliedFocusRequest: Props['focusRequest'] = null;
    let nodeList: NodeSingular[] = [], hubs = new Set<string>(), highlighted = new Set<string>();
    let world = { x1: 0, y1: 0, w: 1, h: 1 };
    let activeSystem: System = props.system, scenePositions: SystemPositions = {}, sizedReading = '';
    const previousLabels = new Set<string>();
    type Camera = { zoom: number; pan: { x: number; y: number } };
    let homeCamera: Camera | undefined;
    const history: Camera[] = [];
    let settledCamera: Camera | undefined;
    function remember(instance: Core) {
      const camera = settledCamera ?? { zoom: instance.zoom(), pan: { ...instance.pan() } };
      if (JSON.stringify(history.at(-1)) !== JSON.stringify(camera)) history.push(camera);
      if (history.length > 30) history.shift();
      setCanUndo(history.length > 0);
    }
    const labelStyles = new Map<string, string>();
    const classes = new Map<string, string>();
    const measurements = new Map<string, number>();
    const context = document.createElement('canvas').getContext('2d');
    function saveCamera(instance: Core) {
      const memory = latest.current.memory.current;
      memory.camera = { key: currentKey, zoom: instance.zoom(), x: (instance.width() / 2 - instance.pan().x) / instance.zoom(), y: (instance.height() / 2 - instance.pan().y) / instance.zoom(), baseZoom: homeZoom };
      (memory.cameras ??= {})[activeSystem] = memory.camera;
    }
    function receipt(instance: Core) {
      if (!container.current) return;
      container.current.dataset.nodes = String(nodeList.length);
      container.current.dataset.connections = String(latest.current.graph.connections.length);
      container.current.dataset.highlighted = String(highlighted.size);
      container.current.dataset.zoom = String(instance.zoom());
      container.current.dataset.pan = JSON.stringify(instance.pan());
      container.current.dataset.system = latest.current.system;
      container.current.dataset.reading = latest.current.reading;
      container.current.dataset.focused = focused ?? '';
      if (navigation.current) navigation.current.textContent = `Zoom ×${(instance.zoom() / homeZoom).toFixed(1)} · ${isolatedRef.current ? 'Voisinage isolé' : 'Ensemble de la carte'}`;
      if (miniViewport.current) {
        const extent = instance.extent(), x = Math.max(0, (extent.x1 - world.x1) / world.w * 100), y = Math.max(0, (extent.y1 - world.y1) / world.h * 70);
        const right = Math.min(100, (extent.x2 - world.x1) / world.w * 100), bottom = Math.min(70, (extent.y2 - world.y1) / world.h * 70);
        miniViewport.current.setAttribute('x', String(Math.min(100, x))); miniViewport.current.setAttribute('y', String(Math.min(70, y)));
        miniViewport.current.setAttribute('width', String(Math.max(0, right - x))); miniViewport.current.setAttribute('height', String(Math.max(0, bottom - y)));
      }
    }
    function scale(instance: Core) {
      if (disposed || instance.destroyed()) return;
      const zoom = instance.zoom(), ratio = zoom / homeZoom;
      const selected = hover ?? focused ?? latest.current.selected;
      const groups = latest.current.reading === 'groups', readingChanged = sizedReading !== latest.current.reading;
      const zoomChanged = zoom !== sizedZoom;
      const candidates: LabelCandidate[] = [];
      const pan = instance.pan(), width = instance.width(), height = instance.height();
      instance.batch(() => {
        nodeList.forEach(n => {
          if (n.hidden()) return;
          const degree = n.data('degree') as number;
          const important = n.id() === selected;
          const person = n.data('kind') === 'person';
          const baseRadius = person ? groups && ratio < 1.8 ? 1.3 : 3.2 : degree < 4 && groups ? 1.2 : groups ? Math.min(12, 2 + Math.sqrt(degree) * .45) : 3.5;
          const radius = (important ? Math.max(7, baseRadius) : baseRadius) * Math.pow(Math.max(.6, ratio), .23);
          const position = n.position();
          if (zoomChanged || readingChanged || selected !== sizedSelected && (important || n.id() === sizedSelected)) {
            n.style({ width: radius * 2 / zoom, height: radius * 2 / zoom, 'border-width': important ? 2 / zoom : 0, 'underlay-padding': 6 / zoom });
          }
          const x = position.x * zoom, y = position.y * zoom;
          if (x + pan.x < -20 || x + pan.x > width + 20 || y + pan.y < -20 || y + pan.y > height + 20) return;
          const eligible = !groups || ratio >= 1.8 || !person && degree >= 4 || important || highlighted.has(n.id());
          if (eligible && (!focused || important || highlighted.has(n.id()))) candidates.push({ id: n.id(), text: groups && !person ? n.data('groupLabel') : n.data('label'), x, y, radius, priority: important ? 100 : !selected && hubs.has(n.id()) ? 65 : highlighted.has(n.id()) ? 30 + Math.min(20, degree) : groups && !person ? 26 + Math.min(25, degree) : Math.min(25, degree), side: 'bottom' });
        });
        if (zoomChanged) instance.edges().forEach(e => { e.style('width', (e.hasClass('system-edge') ? 2.5 : e.hasClass('system-trace') ? 1.2 : .5) / zoom); });
        const placements = placeLabels(candidates, { level: ratio > 3 ? 2 : ratio > 1.6 ? 1 : 0, small: width < 550, compact: true, previous: previousLabels, maxLabels: width < 550 ? 30 : 60, maxCandidates: 160,
          viewport: { x1: -pan.x + 8, y1: -pan.y + 8, x2: width - pan.x - 8, y2: height - pan.y - 8 },
          measure: (text, size, bold) => { const key = `${text}:${size}:${bold}`; if (!measurements.has(key)) { if (context) context.font = `${bold ? 650 : 500} ${size}px ${graphFont}`; measurements.set(key, context?.measureText(text).width ?? text.length * size * .55); } return measurements.get(key)!; },
        });
        const labels = new Map(placements.map(p => [p.id, p]));
        // Hidden nodes already have no label. Touch only labels that changed.
        for (const id of new Set([...previousLabels, ...labels.keys()])) {
          const style = atlasLabelStyle(labels.get(id), zoom, id === selected), key = JSON.stringify(style);
          if (labelStyles.get(id) !== key) instance.getElementById(id).style(style);
          if (labels.has(id)) labelStyles.set(id, key); else labelStyles.delete(id);
        }
        previousLabels.clear(); placements.forEach(p => previousLabels.add(p.id));
      });
      sizedZoom = zoom; sizedSelected = selected; sizedReading = latest.current.reading;
      receipt(instance);
    }
    function schedule(instance: Core) {
      if (!moving && settledCamera) remember(instance);
      moving = true; hover = null;
      clearTimeout(hoverTimer); clearTimeout(settleTimer); cancelAnimationFrame(markFrame); markFrame = 0;
      receipt(instance);
      // Camera gestures use the renderer's cached scene. Refine names when idle.
      settleTimer = setTimeout(() => settle(instance), 120);
    }
    function settle(instance: Core) {
      clearTimeout(settleTimer); moving = false;
      if (!mark(instance)) scale(instance);
      settledCamera = { zoom: instance.zoom(), pan: { ...instance.pan() } };
    }
    function scheduleMark(instance: Core) {
      if (!moving && !markFrame) markFrame = requestAnimationFrame(() => { markFrame = 0; mark(instance); });
    }
    function mark(instance: Core) {
      const { graph, selected, selectedEdge, focusRequest } = latest.current;
      if (focusRequest && focusRequest !== appliedFocusRequest) {
        appliedFocusRequest = focusRequest;
        if (focusRequest.id === selected && graph.neighbors.has(selected)) focused = selected;
      }
      const id = focused ?? hover ?? selected;
      const neighborhoodDepth = !focused && hover ? 1 : depthRef.current;
      const key = JSON.stringify([id, hover, focused, selectedEdge, neighborhoodDepth, isolatedRef.current, latest.current.reading]);
      if (disposed || instance.destroyed() || markedKey === key) return false;
      markedKey = key;
      highlighted = id ? systemNeighborhood(graph, id, neighborhoodDepth) : new Set();
      const active = highlighted.size > 0;
      const isolatedIds = isolatedRef.current ? systemNeighborhood(graph, isolatedRef.current, depthRef.current) : undefined;
      instance.batch(() => {
        nodeList.forEach(n => {
          const display = !isolatedIds || isolatedIds.has(n.id()) ? 'element' : 'none';
          if (n.style('display') !== display) n.style('display', display);
          const next = !active ? '' : n.id() === id ? 'system-selected' : highlighted.has(n.id()) ? 'system-neighbor' : focused ? 'system-dim' : '';
          if ((classes.get(n.id()) ?? '') !== next) { n.classes(next); classes.set(n.id(), next); }
        });
        instance.edges().forEach(e => {
          const display = !isolatedIds || isolatedIds.has(e.data('source')) && isolatedIds.has(e.data('target')) ? 'element' : 'none';
          if (e.style('display') !== display) e.style('display', display);
          const traced = active && highlighted.has(e.data('source')) && highlighted.has(e.data('target'));
          const picked = active && selectedEdge && (e.data('relations') as string[]).includes(selectedEdge);
          const next = (!active ? '' : traced ? 'system-trace' : focused ? 'system-dim' : '') + (picked ? ' system-edge' : '');
          const previous = classes.get(e.id()) ?? '';
          if (previous !== next) {
            e.classes(next); classes.set(e.id(), next);
            const previousWidth = previous.includes('system-edge') ? 2.5 : previous.includes('system-trace') ? 1.2 : .5;
            const nextWidth = picked ? 2.5 : traced ? 1.2 : .5;
            if (previousWidth !== nextWidth) e.style('width', nextWidth / instance.zoom());
          }
        });
      });
      scale(instance);
      return true;
    }
    function fit(instance: Core) {
      instance.resize(); instance.fit(instance.nodes().filter(n => n.visible()), instance.width() < 600 ? 18 : 24);
      homeZoom = instance.zoom(); sizedZoom = 0; scale(instance);
      homeCamera = { zoom: instance.zoom(), pan: { ...instance.pan() } };
    }
    function populate(instance: Core) {
      if (!latest.current.memory.current.positions) return;
      const { graph, memory, system, organization, politics } = latest.current;
      const nextKey = `${system}:${systemGraphKey(graph)}`;
      if (currentKey === nextKey) { scheduleMark(instance); return; }
      if (currentKey) saveCamera(instance);
      const saved = memory.current.cameras?.[system];
      if (activeSystem !== system || focused && !graph.neighbors.has(focused)) focused = null;
      if (activeSystem !== system) { history.length = 0; settledCamera = undefined; setCanUndo(false); isolatedRef.current = null; isolationCamera.current = undefined; setIsolated(null); }
      activeSystem = system;
      currentKey = nextKey;
      markedKey = ''; sizedZoom = 0; hover = null; highlighted.clear();
      previousLabels.clear(); labelStyles.clear(); classes.clear();
      const layouts = memory.current.layouts ??= {};
      if (!layouts[system]) {
        const aspect = Math.min(3, Math.max(.65, instance.width() / Math.max(1, instance.height()) * .85));
        // The complete network uses the topology-based layout with hub
        // clearances. Thematic views keep their category-specific anchors.
        const organized = system === 'all' ? memory.current.positions! : organizeSystem(organization);
        layouts[system] = Object.fromEntries(Object.entries(organized).map(([id, p]) => [id, { x: p.x * aspect, y: p.y }]));
      }
      const positions = layouts[system];
      scenePositions = { ...memory.current.positions!, ...positions };
      const entityById = new Map(graph.entities.map(e => [e.id, e]));
      const partyColors = new Map(politics.parties.map(p => [p.entity.id, p.color]));
      instance.batch(() => {
        instance.elements().remove();
        instance.add([
          ...graph.entities.map(e => {
            const affiliations = politics.people.get(e.id) ?? [];
            const people = [...(graph.neighbors.get(e.id) ?? [])].filter(id => entityById.get(id)?.type === 'person').length;
            return { data: { id: e.id, label: shortLabel(e), groupLabel: people ? `${shortLabel(e)} · ${people}` : shortLabel(e), kind: e.type, shape: e.type === 'person' ? 'ellipse' : 'roundrectangle', color: e.type === 'person' ? affiliations[0]?.color ?? UNKNOWN_POLITICAL_COLOR : partyColors.get(e.id) ?? typeInfo[e.type].color, badge: e.type === 'person' ? affiliationSymbol(affiliations) ?? 'none' : 'none', degree: graph.neighbors.get(e.id)?.size ?? 0 }, position: { ...(scenePositions[e.id] ?? { x: 0, y: 0 }) } };
          }),
          ...graph.connections.map(c => ({ data: c })),
        ]);
      });
      nodeList = [...instance.nodes()];
      const bounds = instance.nodes().boundingBox(); world = { x1: bounds.x1, y1: bounds.y1, w: Math.max(1, bounds.w), h: Math.max(1, bounds.h) };
      miniPoints.current?.setAttribute('d', nodeList.map(n => `M${((n.position('x') - world.x1) / world.w * 100).toFixed(1)},${((n.position('y') - world.y1) / world.h * 70).toFixed(1)}h.1`).join(''));
      hubs = new Set([...nodeList].sort((a, b) => b.data('degree') - a.data('degree')).slice(0, 5).map(n => n.id()));
      fit(instance);
      if (saved) { homeZoom = saved.baseZoom ?? homeZoom; instance.viewport({ zoom: saved.zoom, pan: { x: instance.width() / 2 - saved.x * saved.zoom, y: instance.height() / 2 - saved.y * saved.zoom } }); }
      mark(instance);
    }
    Promise.all([import('cytoscape'), document.fonts.load(`500 14px ${graphFont}`)]).then(async ([{ default: cytoscape }]) => {
      if (disposed || !container.current) return;
      const instance = cytoscape({ container: container.current, elements: [], minZoom: .005, maxZoom: 4, pixelRatio: Math.min(window.devicePixelRatio, 2), hideEdgesOnViewport: props.whole.entities.length > 1000,
        style: [
          { selector: 'node', style: { width: 8, height: 8, shape: n => n.data('shape'), 'background-color': 'data(color)', 'background-image': 'data(badge)', 'background-width': '100%', 'background-height': '100%', label: '', color: atlasTheme.ink, 'font-family': graphFont, 'text-wrap': 'wrap', 'text-background-color': atlasTheme.paper, 'text-background-opacity': .95, 'overlay-opacity': 0 } },
          { selector: 'edge', style: { width: 1, 'line-color': '#6b83a5', opacity: .25, 'curve-style': 'straight', 'overlay-opacity': 0 } },
          { selector: 'node.system-dim', style: { opacity: .22 } },
          { selector: 'edge.system-dim', style: { opacity: .06 } },
          { selector: 'node.system-selected', style: { 'border-color': atlasTheme.brand, 'underlay-color': atlasTheme.brand, 'underlay-opacity': .12, 'font-weight': 600 } },
          { selector: 'edge.system-trace', style: { 'line-color': atlasTheme.brand, opacity: .85, width: 2 } },
          { selector: 'edge.system-edge', style: { 'line-color': atlasTheme.brand, opacity: 1, width: 4 } },
        ],
      });
      cy.current = instance;
      frame.current = () => { remember(instance); fit(instance); };
      checkpoint.current = () => remember(instance);
      undo.current = () => {
        const camera = history.pop();
        if (!camera) return;
        settledCamera = undefined; moving = true;
        instance.viewport(camera); settle(instance); setCanUndo(history.length > 0);
      };
      refine.current = () => settle(instance);
      refresh.current = () => populate(instance);
      inspect.current = () => {
        if (focused !== latest.current.selected) focused = null;
        if (isolatedRef.current && isolatedRef.current !== latest.current.selected) { isolatedRef.current = null; setIsolated(null); restoreIsolationCamera(); }
        scheduleMark(instance);
      };
      instance.on('tap', 'node', e => { focused = null; latest.current.onSelect(e.target.id()); scheduleMark(instance); });
      instance.on('tap', e => { if (e.target === instance) { focused = null; hover = null; latest.current.onClear(); scheduleMark(instance); } });
      instance.on('dbltap', 'node', e => { focused = e.target.id(); latest.current.onSelect(e.target.id()); scheduleMark(instance); });
      instance.on('tap', 'edge', e => { focused = null; latest.current.onEdge((e.target.data('relations') as string[])[0]); scheduleMark(instance); });
      instance.on('mouseover', 'node', e => { if (moving) return; clearTimeout(hoverTimer); hover = e.target.id(); scheduleMark(instance); });
      instance.on('mouseout', 'node', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => { hover = null; scheduleMark(instance); }, 40); });
      instance.on('zoom pan drag', () => schedule(instance));
      instance.on('dragfree', 'node', e => {
        if (!isolatedRef.current) {
          const positions = latest.current.memory.current.layouts![latest.current.system];
          positions[e.target.id()] = { ...e.target.position() }; scenePositions[e.target.id()] = { ...e.target.position() };
        }
        scale(instance);
      });
      let width = container.current.clientWidth, height = container.current.clientHeight;
      observer = new ResizeObserver(() => {
        if (!container.current || !container.current.clientWidth || !container.current.clientHeight) return;
        const atHome = homeCamera && !isolatedRef.current && Math.abs(instance.zoom() - homeCamera.zoom) < .0001
          && Math.abs(instance.pan().x - homeCamera.pan.x) < 1 && Math.abs(instance.pan().y - homeCamera.pan.y) < 1;
        const dx = (container.current.clientWidth - width) / 2, dy = (container.current.clientHeight - height) / 2;
        width = container.current.clientWidth; height = container.current.clientHeight;
        if (atHome) fit(instance);
        else { instance.resize(); instance.panBy({ x: dx, y: dy }); }
      });
      observer.observe(container.current);
      if (latest.current.memory.current.positions) { populate(instance); setReady(true); return; }
      const started = performance.now();
      let prepared: SystemPositions | undefined;
      try { prepared = await matchingSystemPositions(latest.current.whole, (await import('@/data/system-layout.json')).default); }
      catch { /* A missing snapshot or unsupported digest falls back to the worker. */ }
      if (disposed) return;
      if (prepared) {
        latest.current.memory.current.positions = prepared;
        if (container.current) { container.current.dataset.layoutMs = String(Math.round(performance.now() - started)); container.current.dataset.layoutSource = 'snapshot'; }
        populate(instance); setReady(true); return;
      }
      const fail = () => { worker?.terminate(); clearTimeout(timeout); if (!disposed) latest.current.onFallback(); };
      worker = new Worker(new URL('../workers/system-layout.worker.ts', import.meta.url));
      worker.onerror = fail;
      worker.onmessage = (event: MessageEvent<{ positions?: SystemPositions; error?: string }>) => {
        clearTimeout(timeout); worker?.terminate();
        if (disposed) return;
        if (!event.data.positions || latest.current.whole.entities.some(e => !Number.isFinite(event.data.positions?.[e.id]?.x) || !Number.isFinite(event.data.positions?.[e.id]?.y))) { fail(); return; }
        latest.current.memory.current.positions = event.data.positions;
        if (container.current) { container.current.dataset.layoutMs = String(Math.round(performance.now() - started)); container.current.dataset.layoutSource = 'worker'; }
        populate(instance); setReady(true);
      };
      timeout = setTimeout(fail, 60000);
      worker.postMessage(systemLayoutInput(latest.current.whole));
    }).catch(() => { if (!disposed) latest.current.onFallback(); });
    return () => {
      disposed = true; observer?.disconnect(); worker?.terminate(); clearTimeout(timeout); clearTimeout(settleTimer); clearTimeout(hoverTimer); cancelAnimationFrame(markFrame);
      if (cy.current) { if (currentKey) saveCamera(cy.current); cy.current.destroy(); cy.current = null; }
      refresh.current = () => {}; inspect.current = () => {}; frame.current = () => {}; refine.current = () => {};
    };
  // This renderer owns one scene; callbacks and projections are read through latest.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh.current(); }, [props.graph, props.system]);
  useEffect(() => { depthRef.current = depth; isolatedRef.current = isolated; inspect.current(); }, [depth, props.selected, props.selectedEdge, isolated, props.reading, props.focusRequest]);

  function restoreIsolationCamera() {
    const instance = cy.current, saved = isolationCamera.current;
    if (instance && saved) instance.viewport({ zoom: saved.zoom, pan: { x: instance.width() / 2 - saved.x * saved.zoom, y: instance.height() / 2 - saved.y * saved.zoom } });
    isolationCamera.current = undefined;
  }
  function toggleIsolation() {
    const instance = cy.current;
    if (!instance || !props.selected) return;
    if (isolated) { isolatedRef.current = null; setIsolated(null); refine.current(); restoreIsolationCamera(); }
    else {
      isolationCamera.current = { zoom: instance.zoom(), x: (instance.width() / 2 - instance.pan().x) / instance.zoom(), y: (instance.height() / 2 - instance.pan().y) / instance.zoom() };
      isolatedRef.current = props.selected; setIsolated(props.selected); refine.current(); approach();
    }
  }
  function zoom(factor: number) { checkpoint.current(); const instance = cy.current; if (instance) instance.zoom({ level: Math.min(instance.maxZoom(), Math.max(instance.minZoom(), instance.zoom() * factor)), renderedPosition: { x: instance.width() / 2, y: instance.height() / 2 } }); }
  function approach() {
    const instance = cy.current, selected = latest.current.selected;
    if (!instance || !selected) return;
    checkpoint.current();
    const ids = systemNeighborhood(latest.current.graph, selected, depthRef.current);
    const nodes = instance.nodes().filter(n => ids.has(n.id()));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) instance.fit(nodes, 70);
    else instance.animate({ fit: { eles: nodes, padding: 70 } }, { duration: 500 });
  }
  async function download() {
    if (!cy.current || exporting) return;
    setExporting(true); setMessage('');
    try { const { exportGraphPng } = await import('@/lib/export-png'); refine.current(); await exportGraphPng(cy.current, document.createElementNS('http://www.w3.org/2000/svg', 'svg'), latest.current.exportInfo); setMessage('PNG exporté avec la provenance et le contexte du système.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'L’export PNG a échoué.'); }
    finally { setExporting(false); }
  }
  const picked = props.graph.connections.find(c => c.relations.includes(props.selectedEdge ?? ''));
  const selectedVisible = props.selected && props.graph.neighbors.has(props.selected);
  return <div className="graph-stage system-stage" data-testid="system-graph-stage" data-ready={ready}>
    <div ref={container} className="graph-canvas" role="img" aria-label={`Système de ${props.graph.entities.length} entités et ${props.graph.connections.length} connexions. La liste et la recherche permettent l’exploration au clavier.`} />
    {!ready && <p className="system-loading" role="status">Disposition du système en cours… Vous pouvez continuer à utiliser la recherche et les filtres.</p>}
    {ready && !props.graph.relations.length && <p className="system-loading" role="status">Aucun lien ne correspond aux filtres actuels. La sélection reste disponible ; ajustez les catégories ou la période pour retrouver des liens.</p>}
    {selectedVisible && <div className="system-selection-tools" role="group" aria-label="Explorer la sélection"><button onClick={approach} disabled={!ready}><ScanSearch size={15} />Approcher</button><button aria-pressed={depth === 2} disabled={!ready} onClick={() => setNeighborhood({ selected: props.selected, edge: props.selectedEdge, depth: depth === 1 ? 2 : 1 })}>Voisins à deux étapes</button><button aria-pressed={Boolean(isolated)} onClick={toggleIsolation}>Isoler le voisinage</button><button onClick={props.onCentered}>Vue centrée</button><button onClick={() => { isolatedRef.current = null; setIsolated(null); restoreIsolationCamera(); props.onClear(); }}>Effacer la sélection</button></div>}
    {picked && picked.relations.length > 1 && <details className="system-statements"><summary>{picked.relations.length} déclarations sur cette connexion</summary>{picked.relations.map(id => { const r = props.graph.relations.find(r => r.id === id)!; return <button key={id} onClick={() => props.onEdge(id)} aria-pressed={props.selectedEdge === id}>{r.label} · {r.cohort?.label ?? periodLabel(r)}</button>; })}</details>}
    <div className="graph-controls" aria-label="Contrôles du système"><button className="icon-button" aria-label="Revenir au cadrage précédent" disabled={!canUndo} onClick={() => undo.current()}><Undo2 size={17} /></button><button className="icon-button" aria-label="Zoom avant" disabled={!ready} onClick={() => zoom(1.5)}><Plus size={18} /></button><button className="icon-button" aria-label="Zoom arrière" disabled={!ready} onClick={() => zoom(1 / 1.5)}><Minus size={18} /></button><span /><button className="icon-button" aria-label="Recentrer le système" disabled={!ready} onClick={() => frame.current()}><Maximize size={17} /></button><span /><button className="icon-button" aria-label="Exporter la carte en PNG" disabled={!ready || exporting} onClick={download}><Download size={17} /></button></div>
    {message && <p className="graph-export-message" role="status">{message}</p>}
    <div className="system-minimap"><svg viewBox="0 0 100 70" role="img" aria-label="Position du cadrage dans le système"><path ref={miniPoints} fill="none" stroke="#6b83a5" strokeWidth=".7" /><rect ref={miniViewport} fill="#08357715" stroke="#083577" strokeWidth="1" /></svg><span>Zone visible</span></div>
    <span className="system-navigation-receipt" ref={navigation} /><p className="graph-tip"><MousePointer2 size={18} /><span>Un clic ouvre la fiche. Double-cliquez pour atténuer le reste de la carte ; cliquez dans le fond pour tout revoir.</span></p>
  </div>;
}
