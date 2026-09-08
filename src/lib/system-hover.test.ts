import cytoscape from 'cytoscape';
import { expect, test } from 'vitest';
import { systemHoverScene } from './system-hover';

test('hover previews direct visible connections without restyling or moving the graph', () => {
  const cy = cytoscape({ headless: true, styleEnabled: true, layout: { name: 'preset' }, elements: [
    { data: { id: 'school', label: 'ENA', kind: 'school', outline: '#207667' }, position: { x: 100, y: 100 } },
    { data: { id: 'person', label: 'Personne', kind: 'person', outline: '#102a50' }, position: { x: 200, y: 100 } },
    { data: { id: 'unrelated' }, position: { x: 300, y: 100 } },
    { data: { id: 'edge', source: 'school', target: 'person' } },
  ] });
  try {
    const selected = cy.$id('school'); selected.addClass('system-selected');
    const before = cy.nodes().map(n => ({ ...n.position() }));
    let writes = 0; cy.on('style', () => { writes++; });
    for (let i = 0; i < 8; i++) {
      const scene = systemHoverScene(selected);
      expect(scene.label).toBe('ENA');
      expect(scene.links).toHaveLength(1);
      expect(scene.neighbors.map(n => n.id)).toEqual(['person']);
    }
    expect(writes).toBe(0);
    expect(cy.nodes().map(n => ({ ...n.position() }))).toEqual(before);
    expect(selected.hasClass('system-selected')).toBe(true);
    cy.$id('person').style('display', 'none');
    expect(systemHoverScene(selected).links).toHaveLength(0);
  } finally { cy.destroy(); }
});
