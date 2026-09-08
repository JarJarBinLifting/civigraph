'use client';

import { useEffect, useRef, useState } from 'react';
import type { Core, ElementDefinition } from 'cytoscape';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { Entity } from '@/lib/types';
import { shortLabel } from '@/lib/presentation';
import { graphFont, atlasTheme } from '@/lib/graph-theme';
import { graphMotion, graphMotionEnabled, graphNodeAppearance } from '@/lib/graph-appearance';

export interface AnalysisNode { entity: Entity; count?: number; column?: number }
export interface AnalysisEdge { id: string; source: string; target: string; count: number }

/** Bounded maps: every node has a readable name and an equivalent button outside the canvas. */
export function AnalysisGraph({ nodes, edges, selected, onSelect, onEdge, columns = false, evidence = false }: {
  nodes: AnalysisNode[]; edges: AnalysisEdge[]; selected?: string; columns?: boolean; evidence?: boolean;
  onSelect: (id: string) => void; onEdge?: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null), cy = useRef<Core | null>(null);
  const callbacks = useRef({ onSelect, onEdge });
  const selection = useRef(selected), inspect = useRef<(id?: string) => void>(() => {});
  const [failed, setFailed] = useState(false);
  useEffect(() => { callbacks.current = { onSelect, onEdge }; }, [onSelect, onEdge]);
  useEffect(() => { selection.current = selected; inspect.current(selected); }, [selected]);
  useEffect(() => {
    let disposed = false, observer: ResizeObserver | undefined;
    import('cytoscape').then(({ default: cytoscape }) => {
      if (!container.current || disposed) return;
      const elements: ElementDefinition[] = [
        ...nodes.map(({ entity, count }) => ({ data: { id: entity.id, ...graphNodeAppearance(entity.type), label: `${shortLabel(entity)}${count === undefined ? '' : `\n${count} personnes`}`, diameter: count === undefined ? entity.type === 'person' ? 22 : 28 : Math.min(44, 22 + Math.sqrt(count) * 1.6) } })),
        ...edges.map(edge => ({ data: { ...edge, weight: Math.min(3, .7 + Math.sqrt(edge.count) / 4), label: `${edge.count}` } })),
      ];
      const instance = cytoscape({ container: container.current, elements, layout: { name: 'preset' }, minZoom: .5, maxZoom: 3, userPanningEnabled: true,
        style: [
          { selector: 'node', style: { width: 'data(diameter)', height: 'data(diameter)', shape: node => node.data('shape'), 'background-color': 'data(soft)', 'border-color': 'data(outline)', 'border-width': 1.2, label: 'data(label)', color: atlasTheme.ink, 'font-family': graphFont, 'font-size': 13, 'font-weight': 500, 'text-valign': 'bottom', 'text-margin-y': 9, 'text-wrap': 'wrap', 'text-max-width': '145px', 'text-background-color': '#fff', 'text-background-opacity': .96, 'text-background-padding': '3px', 'overlay-opacity': 0 } },
          { selector: 'edge', style: { width: evidence ? 1.8 : 'data(weight)', 'line-color': evidence ? '#42668c' : '#7d91ad', opacity: evidence ? .8 : columns ? .35 : .09, 'curve-style': 'bezier', 'text-background-color': '#fff', 'text-background-opacity': 1, 'text-background-padding': '4px', 'font-size': 13, color: atlasTheme.ink, 'overlay-opacity': 0 } },
          { selector: 'node.neighbor', style: { 'background-color': 'data(color)', 'border-color': 'data(color)' } },
          { selector: 'node.active', style: { 'background-color': 'data(color)', 'border-color': atlasTheme.brand, 'border-width': 2, 'underlay-color': atlasTheme.brand, 'underlay-opacity': .08, 'underlay-padding': 5, 'underlay-shape': node => node.data('type') === 'person' ? 'ellipse' : 'round-rectangle' } },
          { selector: 'edge.active', style: { opacity: .9, 'line-color': atlasTheme.brand, label: columns ? '' : 'data(label)' } },
          { selector: 'node.dim', style: { opacity: .35 } },
        ],
      });
      cy.current = instance;
      const position = () => {
        if (disposed) return;
        instance.stop(true, false);
        instance.resize();
        const w = instance.width(), h = instance.height();
        const colCount = columns ? 2 : w < 600 ? 2 : 3;
        const rows = Math.ceil(nodes.length / colCount);
        const byColumn = [nodes.filter(n => n.column === 0), nodes.filter(n => n.column === 1)];
        instance.batch(() => nodes.forEach((node, i) => {
          const column = columns ? node.column ?? 0 : i % colCount;
          const row = columns ? byColumn[column].findIndex(n => n.entity.id === node.entity.id) : Math.floor(i / colCount);
          const rowCount = columns ? byColumn[column].length : rows;
          instance.$id(node.entity.id).position({ x: (column + .5) * w / colCount, y: 30 + (row + .5) * (h - 110) / Math.max(1, rowCount) });
          instance.$id(node.entity.id).style('text-max-width', Math.max(95, Math.min(160, w / colCount - 24)));
        }));
        instance.viewport({ zoom: 1, pan: { x: 0, y: 0 } });
      };
      function highlight(id?: string) {
        instance.batch(() => {
          instance.elements().removeClass('active dim neighbor');
          if (!id) return;
          const node = instance.$id(id); node.addClass('active'); node.connectedEdges().addClass('active');
          node.neighborhood().nodes().addClass('neighbor');
          instance.nodes().difference(node.closedNeighborhood()).addClass('dim');
        });
      }
      instance.on('tap', 'node', event => callbacks.current.onSelect(event.target.id()));
      instance.on('tap', 'edge', event => callbacks.current.onEdge?.(event.target.id()));
      instance.on('mouseover', 'node', event => highlight(event.target.id()));
      instance.on('mouseout', 'node', () => highlight(selection.current));
      instance.on('mousedown touchstart', () => { instance.stop(true, false); });
      inspect.current = highlight;
      position(); highlight(selection.current);
      observer = new ResizeObserver(position); observer.observe(container.current);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; observer?.disconnect(); inspect.current = () => {}; cy.current?.destroy(); cy.current = null; };
  }, [nodes, edges, columns, evidence]);
  function zoom(factor: number) {
    const instance = cy.current; if (!instance) return;
    instance.stop(true, false);
    const zoom = { level: Math.max(.5, Math.min(3, instance.zoom() * factor)), renderedPosition: { x: instance.width() / 2, y: instance.height() / 2 } };
    if (graphMotionEnabled()) instance.animate({ zoom }, { duration: graphMotion.camera, easing: 'ease-out-cubic', queue: false });
    else instance.zoom(zoom);
  }
  return <div className="analysis-map" data-testid="analysis-map">
    <div className="analysis-canvas" ref={container} role="img" aria-label={`Carte de ${nodes.length} entités et ${edges.length} connexions. Les mêmes résultats sont accessibles dans la liste ci-dessous.`} />
    {failed && <p role="status">Carte indisponible. Tous les résultats restent accessibles ci-dessous.</p>}
    <div className="analysis-map-tools"><button aria-label="Agrandir les détails" onClick={() => zoom(1.25)}><Plus size={16} /></button><button aria-label="Réduire les détails" onClick={() => zoom(.8)}><Minus size={16} /></button><button aria-label="Revenir au cadrage de la carte" onClick={() => cy.current?.stop(true, false).viewport({ zoom: 1, pan: { x: 0, y: 0 } })}><Maximize size={16} /></button></div>
  </div>;
}
