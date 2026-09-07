import cytoscape from 'cytoscape';
import fcose, { type FcoseLayoutOptions } from 'cytoscape-fcose';
import type { SystemLayoutInput, SystemPositions } from './system-graph';

cytoscape.use(fcose);

/** Runs only in a worker in the app. Never publishes or infers relationships. */
export function computeSystemLayout(input: SystemLayoutInput): SystemPositions {
  if (!input.nodes.length) return {};
  const graph = cytoscape({ headless: true, styleEnabled: true, elements: [
    ...input.nodes.map((node, i) => ({ data: node, position: { x: Math.cos(i * 2.399963) * Math.sqrt(i + 1) * 25, y: Math.sin(i * 2.399963) * Math.sqrt(i + 1) * 25 } })),
    ...input.edges.map(edge => ({ data: edge })),
  ], style: [{ selector: 'node', style: { width: 14, height: 14 } }] });
  try {
    const options: FcoseLayoutOptions = { name: 'fcose', quality: 'default', randomize: true, animate: false, fit: false,
      nodeRepulsion: node => node.data('degree') <= 1 ? 1000 : 16000,
      idealEdgeLength: edge => edge.source().data('degree') <= 1 || edge.target().data('degree') <= 1 ? 40 : 95,
      edgeElasticity: () => .45, gravity: .12, numIter: 600, tile: true, piTol: .0001,
    };
    graph.layout(options).run();
    const positions: SystemPositions = {};
    graph.nodes().forEach(node => {
      const { x, y } = node.position();
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Disposition invalide.');
      positions[node.id()] = { x, y };
    });
    return positions;
  } finally { graph.destroy(); }
}
