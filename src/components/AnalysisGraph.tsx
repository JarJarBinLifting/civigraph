'use client';

import { useEffect, useRef, useState } from 'react';
import type { Core, ElementDefinition } from 'cytoscape';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { Entity } from '@/lib/types';
import { shortLabel, typeInfo } from '@/lib/presentation';
import { graphFont, atlasTheme } from '@/lib/graph-theme';

export interface AnalysisNode { entity: Entity; count?: number; column?: number }
export interface AnalysisEdge { id: string; source: string; target: string; count: number }

/** Bounded maps: every node has a readable name and an equivalent button outside the canvas. */
export function AnalysisGraph({ nodes, edges, selected, onSelect, onEdge, columns = false }: {
  nodes: AnalysisNode[]; edges: AnalysisEdge[]; selected?: string; columns?: boolean;
  onSelect: (id: string) => void; onEdge?: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null), cy = useRef<Core | null>(null);
  const callbacks = useRef({ onSelect, onEdge });
  const [failed, setFailed] = useState(false);
  useEffect(() => { callbacks.current = { onSelect, onEdge }; }, [onSelect, onEdge]);
  useEffect(() => {
    let disposed = false, observer: ResizeObserver | undefined;
    import('cytoscape').then(({ default: cytoscape }) => {
      if (!container.current || disposed) return;
      const elements: ElementDefinition[] = [
        ...nodes.map(({ entity, count }) => ({ data: { id: entity.id, label: `${shortLabel(entity)}${count === undefined ? '' : `\n${count} personnes`}`, color: typeInfo[entity.type].color, diameter: count === undefined ? 24 : Math.min(44, 18 + Math.sqrt(count) * 2) } })),
        ...edges.map(edge => ({ data: { ...edge, weight: Math.min(7, 1 + Math.sqrt(edge.count) / 2), label: `${edge.count}` } })),
      ];
      const instance = cytoscape({ container: container.current, elements, layout: { name: 'preset' }, minZoom: .5, maxZoom: 3, userPanningEnabled: true,
        style: [
          { selector: 'node', style: { width: 'data(diameter)', height: 'data(diameter)', 'background-color': 'data(color)', label: 'data(label)', color: atlasTheme.ink, 'font-family': graphFont, 'font-size': 13, 'font-weight': 500, 'text-valign': 'bottom', 'text-margin-y': 9, 'text-wrap': 'wrap', 'text-max-width': '145px', 'text-background-color': '#fff', 'text-background-opacity': .96, 'text-background-padding': '3px', 'overlay-opacity': 0 } },
          { selector: 'edge', style: { width: 'data(weight)', 'line-color': '#7d91ad', opacity: columns ? .35 : .09, 'curve-style': 'bezier', 'text-background-color': '#fff', 'text-background-opacity': 1, 'text-background-padding': '4px', 'font-size': 13, color: atlasTheme.ink, 'overlay-opacity': 0 } },
          { selector: 'node.active', style: { 'border-color': atlasTheme.brand, 'border-width': 3, 'underlay-color': atlasTheme.brand, 'underlay-opacity': .08, 'underlay-padding': 7 } },
          { selector: 'edge.active', style: { opacity: .9, 'line-color': atlasTheme.brand, label: columns ? '' : 'data(label)' } },
          { selector: 'node.dim', style: { opacity: .35 } },
        ],
      });
      cy.current = instance;
      const position = () => {
        if (disposed) return;
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
          instance.elements().removeClass('active dim');
          if (!id) return;
          const node = instance.$id(id); node.addClass('active'); node.connectedEdges().addClass('active');
          instance.nodes().difference(node.closedNeighborhood()).addClass('dim');
        });
      }
      instance.on('tap', 'node', event => callbacks.current.onSelect(event.target.id()));
      instance.on('tap', 'edge', event => callbacks.current.onEdge?.(event.target.id()));
      instance.on('mouseover', 'node', event => highlight(event.target.id()));
      instance.on('mouseout', 'node', () => highlight(selected));
      position(); highlight(selected);
      observer = new ResizeObserver(position); observer.observe(container.current);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; observer?.disconnect(); cy.current?.destroy(); cy.current = null; };
  }, [nodes, edges, selected, columns]);
  function zoom(factor: number) { const instance = cy.current; if (instance) instance.zoom({ level: Math.max(.5, Math.min(3, instance.zoom() * factor)), renderedPosition: { x: instance.width() / 2, y: instance.height() / 2 } }); }
  return <div className="analysis-map" data-testid="analysis-map">
    <div className="analysis-canvas" ref={container} role="img" aria-label={`Carte de ${nodes.length} entités et ${edges.length} connexions. Les mêmes résultats sont accessibles dans la liste ci-dessous.`} />
    {failed && <p role="status">Carte indisponible. Tous les résultats restent accessibles ci-dessous.</p>}
    <div className="analysis-map-tools"><button aria-label="Agrandir les détails" onClick={() => zoom(1.25)}><Plus size={16} /></button><button aria-label="Réduire les détails" onClick={() => zoom(.8)}><Minus size={16} /></button><button aria-label="Revenir au cadrage de la carte" onClick={() => cy.current?.viewport({ zoom: 1, pan: { x: 0, y: 0 } })}><Maximize size={16} /></button></div>
  </div>;
}
