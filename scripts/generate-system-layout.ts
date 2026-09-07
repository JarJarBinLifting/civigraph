import { writeFile } from 'node:fs/promises';
import { loadDataset } from '../src/lib/dataset';
import { CATEGORIES } from '../src/lib/types';
import { getSystemGraph, systemLayoutInput, systemTopologyHash } from '../src/lib/system-graph';
import { computeSystemLayout } from '../src/lib/system-layout';

const data = loadDataset();
const graph = getSystemGraph(data, { categories: [...CATEGORIES], temporal: 'all', period: null, selected: data.entities[0].id });
const started = performance.now();
const positions = computeSystemLayout(systemLayoutInput(graph));
for (const p of Object.values(positions)) { p.x = Math.round(p.x * 1000) / 1000; p.y = Math.round(p.y * 1000) / 1000; }
await writeFile(new URL('../src/data/system-layout.json', import.meta.url), JSON.stringify({
  generatedAt: new Date().toISOString(), topologyHash: await systemTopologyHash(graph), positions,
}) + '\n');
console.log(`System layout: ${graph.entities.length} entities, ${graph.connections.length} connections, ${Math.round(performance.now() - started)} ms.`);
