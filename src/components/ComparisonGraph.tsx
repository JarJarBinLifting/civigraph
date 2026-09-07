'use client';

import { useEffect, useRef, useState } from 'react';
import type { Core, ElementDefinition, SingularElementArgument } from 'cytoscape';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { CommonConnection, Entity } from '@/lib/types';
import { shortLabel, typeInfo } from '@/lib/presentation';
import { supportsPeriods } from '@/lib/temporal';
import { comparisonDateLabel } from '@/lib/comparison';
import { atlasLabelStyle, atlasNodeStyles, atlasTheme, nodeShape, nodeSymbol } from '@/lib/graph-theme';
import { labelLevel, placeLabels, type LabelCandidate, type LabelLevel } from '@/lib/graph-labels';

function symbolData(entity: Entity, color?: string) {
  return { id: entity.id, label: shortLabel(entity), color: color ?? typeInfo[entity.type].color, soft: typeInfo[entity.type].soft, shape: nodeShape(entity), badge: nodeSymbol(entity, Boolean(color)) };
}

export function ComparisonGraph({ left, right, common, selected, onSelect }: { left: Entity; right: Entity; common: CommonConnection[]; selected: string; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const callback = useRef(onSelect);
  const selection = useRef(selected);
  const refresh = useRef<() => void>(() => {});
  const recenter = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { callback.current = onSelect; }, [onSelect]);
  useEffect(() => { selection.current = selected; refresh.current(); }, [selected]);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    const portraits: HTMLImageElement[] = [];
    let frame = 0, panTimer: ReturnType<typeof setTimeout> | undefined;
    import('cytoscape').then(({ default: cytoscape }) => {
      if (disposed || !container.current) return;
      const elements: ElementDefinition[] = [
        { data: symbolData(left, atlasTheme.forest), position: { x: -310, y: 0 }, classes: 'person' },
        { data: symbolData(right, atlasTheme.secondary), position: { x: 310, y: 0 }, classes: 'person' },
      ];
      common.forEach((connection, i) => {
        elements.push({ data: symbolData(connection.entity), position: { x: 0, y: (i - (common.length - 1) / 2) * 155 }, classes: `common-entity ${supportsPeriods(connection.entity) ? '' : 'generic-entity'}` });
        for (const [side, person, statements, color] of [['left', left, connection.left, atlasTheme.forest], ['right', right, connection.right, atlasTheme.secondary]] as const) {
          elements.push({ data: { id: `${side}:${connection.entity.id}`, source: person.id, target: connection.entity.id, entity: connection.entity.id, label: comparisonDateLabel(statements), color, relationIds: statements.map(statement => statement.id) } });
        }
      });
      const instance = cytoscape({ container: container.current, elements, layout: { name: 'preset', fit: false }, minZoom: .01, maxZoom: 2.5, wheelSensitivity: 0.8,
        style: [
          ...atlasNodeStyles,
          { selector: 'node', style: { label: 'data(label)', width: 40, height: 40, 'text-wrap': 'wrap', 'line-height': 1.2 } },
          { selector: 'node.person', style: { 'background-color': 'data(color)', 'font-weight': 'bold' } },
          { selector: 'node.portrait', style: { 'background-image': 'data(portrait)', 'background-width': 'auto', 'background-height': 'auto', 'background-fit': 'cover', 'background-clip': 'node' } },
          { selector: 'node.generic-entity', style: { 'border-style': 'dashed' } },
          { selector: 'edge', style: { label: 'data(label)', color: atlasTheme.ink, 'font-family': 'Arial, sans-serif', 'text-wrap': 'wrap', 'text-background-color': atlasTheme.paper, 'text-background-opacity': .95, 'line-color': 'data(color)', 'target-arrow-color': 'data(color)', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'overlay-opacity': 0, 'overlay-padding': 5, opacity: .65 } },
          { selector: '.dimmed', style: { opacity: .35 } },
          { selector: 'node.dimmed', style: { opacity: .7 } },
          { selector: 'node.active, node.hover, node.person, edge.active, edge.hover', style: { opacity: 1 } },
        ],
      });
      cy.current = instance;
      for (const person of [left, right]) {
        if (!person.image) continue;
        const picture = new Image();
        portraits.push(picture);
        picture.onload = () => {
          if (!disposed) instance.$id(person.id).data('portrait', picture.src).addClass('portrait');
        };
        picture.src = person.image.src;
      }
      const context = document.createElement('canvas').getContext('2d'), widths = new Map<string, number>();
      let level: LabelLevel = 0, previous = new Set<string>();
      const labels = () => {
        const zoom = instance.zoom(), pan = instance.pan();
        level = labelLevel(zoom, level);
        instance.batch(() => {
          const candidates: LabelCandidate[] = instance.nodes().map(node => {
            const person = node.hasClass('person'), priority = person ? 100 : node.hasClass('active') ? 90 : node.hasClass('hover') ? 80 : node.hasClass('edge-endpoint') ? 75 : 0;
            const diameter = person ? 44 : 34, position = node.position();
            node.style({ width: diameter / zoom, height: diameter / zoom, 'border-width': (priority >= 80 ? 2 : 1.2) / zoom, 'underlay-padding': 7 / zoom });
            return { id: node.id(), text: node.data('label'), x: position.x * zoom, y: position.y * zoom, radius: diameter / 2, priority, side: person || position.y > 0 ? 'bottom' : 'top' };
          });
          const placements = placeLabels(candidates, { level, previous, small: instance.width() < 500, viewport: { x1: 6 - pan.x, x2: instance.width() - pan.x - 6, y1: 6 - pan.y, y2: instance.height() - pan.y - 6 }, measure: (text, size, bold) => {
            const key = `${size}:${bold}:${text}`;
            if (!widths.has(key)) { if (context) context.font = `${bold ? 'bold' : 'normal'} ${size}px Arial`; widths.set(key, context?.measureText(text).width ?? text.length * size * .55); }
            return widths.get(key)!;
          } });
          const byId = new Map(placements.map(label => [label.id, label])); previous = new Set(byId.keys());
          for (const node of instance.nodes()) node.style(atlasLabelStyle(byId.get(node.id()), zoom, node.is('.person, .active, .hover, .edge-endpoint')));
          for (const edge of instance.edges()) edge.style({ width: (edge.is('.active, .hover') ? 1.8 : .8) / zoom, 'font-size': 12 / zoom, 'text-max-width': 155 / zoom, 'text-background-padding': 3 / zoom, 'text-opacity': instance.width() >= 500 && zoom >= .65 ? 1 : 0 });
        });
      };
      const select = (hovered?: SingularElementArgument) => {
        instance.batch(() => {
          instance.elements().removeClass('active dimmed edge-endpoint');
          instance.$id(selection.current).addClass('active').connectedEdges().addClass('active');
          const subject = hovered ?? instance.$id(selection.current);
          subject.edges().connectedNodes().addClass('edge-endpoint');
          if (subject.length) instance.elements().difference(subject.union(subject.nodes().closedNeighborhood()).union(subject.edges().connectedNodes())).addClass('dimmed');
        });
        labels();
      };
      refresh.current = select;
      const fit = () => {
        instance.resize();
        const compact = instance.width() < 500;
        const x = compact ? 155 : 310;
        instance.$id(left.id).position({ x: -x, y: 0 }); instance.$id(right.id).position({ x, y: 0 });
        const zoom = Math.max(.01, Math.min((instance.width() - 160) / (x * 2), (instance.height() - 116) / Math.max(200, (common.length - 1) * 155), 1.2));
        instance.viewport({ zoom, pan: { x: instance.width() / 2, y: instance.height() / 2 } });
        labels();
      };
      recenter.current = fit;
      instance.on('tap', 'node.common-entity', event => callback.current(event.target.id()));
      instance.on('tap', 'edge', event => callback.current(event.target.data('entity')));
      instance.on('mouseover', 'node, edge', event => { event.target.addClass('hover'); select(event.target); });
      instance.on('mouseout', 'node, edge', event => { event.target.removeClass('hover'); select(); });
      instance.on('zoom', () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; labels(); }); });
      instance.on('pan', () => { clearTimeout(panTimer); panTimer = setTimeout(labels, 100); });
      observer = new ResizeObserver(fit); observer.observe(container.current); fit(); select();
      setReady(true);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; for (const picture of portraits) picture.onload = null; observer?.disconnect(); cancelAnimationFrame(frame); clearTimeout(panTimer); refresh.current = () => {}; recenter.current = () => {}; cy.current?.destroy(); cy.current = null; };
  }, [left, right, common]);
  function zoomBy(factor: number) {
    const instance = cy.current;
    if (!instance) return;
    instance.zoom({ level: Math.max(instance.minZoom(), Math.min(instance.maxZoom(), instance.zoom() * factor)), renderedPosition: { x: instance.width() / 2, y: instance.height() / 2 } });
  }
  return <div className="comparison-map">
    <div className="comparison-map-legend"><span><i style={{ background: atlasTheme.forest }} />{left.label}</span><span>→ Entités communes ←</span><span><i style={{ background: atlasTheme.secondary }} />{right.label}</span></div>
    {failed ? <p role="status">La carte n’est pas disponible dans ce navigateur. Les cartes et leurs sources restent accessibles ci-dessous.</p> : <>
      <div ref={container} className="comparison-canvas" data-testid="comparison-graph" data-ready={ready} role="img" aria-label={`Comparaison de ${left.label} et ${right.label} via ${common.length} entités communes. Les boutons ci-dessous donnent accès aux mêmes preuves au clavier.`} />
      <div className="comparison-map-tools"><button className="icon-button" aria-label="Zoom avant de la comparaison" onClick={() => zoomBy(2)}><Plus size={17} /></button><button className="icon-button" aria-label="Zoom arrière de la comparaison" onClick={() => zoomBy(1 / 2)}><Minus size={17} /></button><button className="icon-button" aria-label="Recentrer la comparaison" onClick={() => recenter.current()}><Maximize size={16} /></button><span>Les dates indiquent les périodes de participation. Touchez une entité pour ses sources.</span></div>
    </>}
    <nav className="common-shortcuts" aria-label="Entités communes et preuves">{common.map(({ entity }) => <button key={entity.id} aria-label={`Consulter ${shortLabel(entity)}`} aria-pressed={selected === entity.id} onClick={() => onSelect(entity.id)}>{shortLabel(entity)}</button>)}</nav>
  </div>;
}
