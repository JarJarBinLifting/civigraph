import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';
type Canvas = HTMLElement & { _cyreg: { cy: Core } };
const assas = '/?root=Q20089181&focus=Q662976&expanded=Q20089181,Q662976&selected=Q662976&time=all';

test('the overview frames every node and balances the complete asymmetric network', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1982, height: 1103 });
  await page.goto(assas);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const framing = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const boxes = cy.nodes().map(node => node.renderedBoundingBox({ includeLabels: false, includeOverlays: false }));
    const x1 = Math.min(...boxes.map(box => box.x1)), x2 = Math.max(...boxes.map(box => box.x2));
    const y1 = Math.min(...boxes.map(box => box.y1)), y2 = Math.max(...boxes.map(box => box.y2));
    // A fitted network can be limited by either axis; filling width must not crop its height.
    return { nodes: cy.nodes().length, edges: cy.edges().length, outside: boxes.filter(box => box.x1 < 0 || box.y1 < 0 || box.x2 > cy.width() || box.y2 > cy.height()).length, balance: Math.abs(x1 - (cy.width() - x2)) / cy.width(), occupied: Math.max((x2 - x1) / cy.width(), (y2 - y1) / cy.height()) };
  });
  expect(framing.nodes).toBe(69); expect(framing.edges).toBe(70);
  expect(framing.outside).toBe(0);
  expect(framing.balance).toBeLessThan(.18);
  expect(framing.occupied).toBeGreaterThan(.65);
});

test('an unknown date does not lower the visual weight of its source', async ({ page }) => {
  await page.goto('/?root=Q3052772');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const weights = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const undated = cy.edges('.undated-edge')[0];
    const dated = cy.edges().not('.undated-edge')[0];
    return { undated: undated.style('opacity'), dated: dated.style('opacity'), undatedBorder: undated.connectedNodes().not('.root')[0].style('border-style') };
  });
  expect(weights.undated).toBe(weights.dated);
  expect(weights.undatedBorder).toBe('solid');
});
