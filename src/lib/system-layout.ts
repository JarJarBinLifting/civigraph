import cytoscape, { type NodeSingular } from 'cytoscape';
import fcose, { type FcoseLayoutOptions } from 'cytoscape-fcose';
import type { SystemLayoutInput, SystemPositions } from './system-graph';
import { separateSystemHubs } from './system-layout-spacing';

cytoscape.use(fcose);

/** Runs only in a worker in the app. Never publishes or infers relationships. */
export function computeSystemLayout(input: SystemLayoutInput): SystemPositions {
  if (!input.nodes.length) return {};
  const graph = cytoscape({ headless: true, styleEnabled: true, elements: [
    ...input.nodes.map((node, i) => ({ data: node, position: { x: Math.cos(i * 2.399963) * Math.sqrt(i + 1) * 25, y: Math.sin(i * 2.399963) * Math.sqrt(i + 1) * 25 } })),
    ...input.edges.map(edge => ({ data: edge })),
  ], style: [{ selector: 'node', style: {
    // These are layout clearances, not rendered symbol sizes. Busy hubs need
    // room for their neighbours even though their visible markers stay small.
    width: (node: NodeSingular) => 14 + Math.min(170, Math.max(0, Math.sqrt(node.data('degree')) - 1) * 15),
    height: (node: NodeSingular) => 14 + Math.min(170, Math.max(0, Math.sqrt(node.data('degree')) - 1) * 15),
  } }] });
  try {
    const options: FcoseLayoutOptions = { name: 'fcose', quality: 'default', randomize: true, animate: false, fit: false,
      nodeRepulsion: node => node.data('degree') <= 1 ? 2400 : 16000 + Math.min(100, node.data('degree')) * 400,
      idealEdgeLength: edge => edge.source().data('degree') <= 1 || edge.target().data('degree') <= 1 ? 45 : 110,
      // Shared neighbours must not pull all major institutions into one point.
      // A leaf keeps a short tether to its actual neighbour; no extra links or
      // categorical clusters are introduced into the simulation.
      edgeElasticity: edge => Math.min(edge.source().data('degree'), edge.target().data('degree')) <= 1 ? .45
        : .45 / Math.max(1, Math.max(edge.source().data('degree'), edge.target().data('degree')) / 2),
      gravity: .08, numIter: 1000, tile: true, piTol: .0001,
    };
    graph.layout(options).run();
    const positions: SystemPositions = {};
    graph.nodes().forEach(node => {
      const { x, y } = node.position();
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Disposition invalide.');
      positions[node.id()] = { x, y };
    });
    return separateSystemHubs(input, positions);
  } finally { graph.destroy(); }
}
