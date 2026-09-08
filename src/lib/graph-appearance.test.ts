import cytoscape from 'cytoscape';
import { expect, test } from 'vitest';
import { graphZoomChanged, syncBadgeOpacity } from './graph-appearance';

test('round-trip zoom rounding does not trigger a full corpus resize', () => {
  const zoom = .137;
  expect(graphZoomChanged(zoom, zoom * (1 + Number.EPSILON))).toBe(false);
  expect(graphZoomChanged(zoom, zoom * 1.000001)).toBe(true);
  expect(graphZoomChanged(zoom, zoom * 1.5)).toBe(true);
  expect(graphZoomChanged(0, zoom)).toBe(true);
});

test('repeated atlas refinement does not restyle unchanged badges', () => {
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: Array.from({ length: 2500 }, (_, i) => ({ data: { id: String(i) } })) });
  try {
    cy.batch(() => cy.nodes().forEach(node => syncBadgeOpacity(node, 0)));
    let writes = 0;
    cy.on('style', () => { writes++; });
    for (let frame = 0; frame < 8; frame++) cy.batch(() => cy.nodes().forEach(node => syncBadgeOpacity(node, 0)));
    expect(writes).toBe(0);
    cy.batch(() => syncBadgeOpacity(cy.nodes()[0], 1));
    expect(writes).toBe(1);
    expect(cy.nodes()[0].style('background-image-opacity')).toBe('1');
    cy.batch(() => syncBadgeOpacity(cy.nodes()[0], 1));
    expect(writes).toBe(1);
    cy.batch(() => syncBadgeOpacity(cy.nodes()[0], 0));
    expect(writes).toBe(2);
  } finally { cy.destroy(); }
});
