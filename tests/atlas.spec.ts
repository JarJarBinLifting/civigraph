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

test('dense names use readable screen pixels and reveal progressively without dropping nodes', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1982, height: 1103 });
  await page.goto('/?root=Q273579&time=all');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const labels = () => page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const visible = cy.nodes().filter(node => Number(node.style('text-opacity')) > 0);
    const local = cy.nodes().filter(node => { const p = node.renderedPosition(); return p.x >= 0 && p.y >= 0 && p.x <= cy.width() && p.y <= cy.height(); });
    return { count: visible.length, namedShare: local.filter(node => Number(node.style('text-opacity')) > 0).length / local.length, min: Math.min(...visible.map(node => Number.parseFloat(node.style('font-size')) * cy.zoom())), max: Math.max(...visible.map(node => Number.parseFloat(node.style('font-size')) * cy.zoom())), nodes: cy.nodes().length, edges: cy.edges().length };
  });
  const overview = await labels();
  expect(overview.count).toBeGreaterThanOrEqual(info.project.name === 'desktop' ? 5 : 3);
  expect(overview.min).toBeGreaterThanOrEqual(11.9); expect(overview.max).toBeLessThanOrEqual(14.1);
  await page.locator('.graph-canvas').evaluate(element => { const cy = (element as Canvas)._cyreg.cy; cy.zoom({ level: .42, renderedPosition: cy.nodes('.root')[0].renderedPosition() }); });
  // A closer camera contains fewer nodes, especially on mobile. Compare the share
  // of named local nodes rather than requiring off-screen names to remain rendered.
  await expect.poll(async () => (await labels()).namedShare).toBeGreaterThan(overview.namedShare);
  if (info.project.name === 'desktop') expect((await labels()).count).toBeGreaterThan(overview.count);
  const detail = await labels();
  expect(detail.min).toBeGreaterThanOrEqual(11.9); expect(detail.max).toBeLessThanOrEqual(14.1);
  expect(detail.nodes).toBe(123); expect(detail.edges).toBe(130);
});

test('opening a profile preserves the observed area and persistent selection after hover', async ({ page }) => {
  await page.goto(assas);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Fermer la fiche', exact: true }).click();
  await expect(page.locator('.workspace')).toHaveClass(/detail-closed/);
  await page.locator('.graph-canvas').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.graph-canvas').evaluate(element => (element as Canvas)._cyreg.cy.width() === element.clientWidth)).toBe(true);
  const point = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const position = cy.$id('Q30527240').position();
    cy.zoom(.9); cy.pan({ x: cy.width() * .63 - position.x * cy.zoom(), y: cy.height() / 2 - position.y * cy.zoom() });
    cy.scratch('atlasCamera', { zoom: cy.zoom(), x: (cy.width() / 2 - cy.pan().x) / cy.zoom(), y: (cy.height() / 2 - cy.pan().y) / cy.zoom() });
    const rendered = cy.$id('Q30527240').renderedPosition(), bounds = element.getBoundingClientRect();
    return { x: bounds.x + rendered.x, y: bounds.y + rendered.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.getByRole('heading', { name: 'Albane Gaillot', exact: true })).toBeVisible();
  await page.mouse.move(5, 5);
  await expect.poll(() => page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy, before = cy.scratch('atlasCamera');
    return Math.abs(cy.zoom() - before.zoom) + Math.abs((cy.width() / 2 - cy.pan().x) / cy.zoom() - before.x) + Math.abs((cy.height() / 2 - cy.pan().y) / cy.zoom() - before.y);
  })).toBeLessThan(.1);
  const selection = await page.locator('.graph-canvas').evaluate(element => {
    const node = (element as Canvas)._cyreg.cy.$id('Q30527240');
    return { active: node.hasClass('active'), opacity: Number(node.style('opacity')), text: Number(node.style('text-opacity')) };
  });
  expect(selection).toEqual({ active: true, opacity: 1, text: 1 });
});

test('comparison names remain readable after zoom and keyboard selection preserves the camera', async ({ page }) => {
  await page.goto('/?root=Q3052772&compare=Q3579995&selected=Q273579');
  const graph = page.getByTestId('comparison-graph');
  await expect(graph).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Zoom arrière de la comparaison', exact: true }).click({ clickCount: 2 });
  const fontSizes = () => graph.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return cy.nodes().filter(node => Number(node.style('text-opacity')) > 0 && node.style('label') !== '').map(node => Number.parseFloat(node.style('font-size')) * cy.zoom());
  });
  await expect.poll(async () => Math.min(...await fontSizes())).toBeGreaterThanOrEqual(11.9);
  expect(Math.max(...await fontSizes())).toBeLessThanOrEqual(14.1);
  await graph.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    cy.scratch('atlasComparisonCamera', { zoom: cy.zoom(), pan: cy.pan() });
  });
  const shortcut = page.getByRole('button', { name: 'Consulter Sciences Po Paris', exact: true });
  await shortcut.focus(); await shortcut.press('Enter');
  await expect(shortcut).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(5, 5);
  await expect.poll(() => graph.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy, before = cy.scratch('atlasComparisonCamera');
    const selected = cy.$id('Q859363');
    return Boolean(before && before.zoom === cy.zoom() && before.pan.x === cy.pan().x && before.pan.y === cy.pan().y && selected.hasClass('active') && Number(selected.style('text-opacity')) === 1 && cy.nodes().length === 5);
  })).toBe(true);
});

test('the exploration step keeps its name and caption clear of the current center', async ({ page }) => {
  await page.goto(assas.replace('selected=Q662976', 'selected=Q30527240'));
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const overlap = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const root = cy.nodes('.root').renderedBoundingBox({ includeLabels: false, includeOverlays: false, includeUnderlays: false });
    const label = cy.$id('Q20089181').renderedBoundingBox({ includeNodes: false, includeEdges: false, includeLabels: true, includeOverlays: false, includeUnderlays: false });
    const legend = [...document.querySelectorAll('.graph-guides text')].find(text => text.textContent === 'Parcours exploré')!.getBoundingClientRect();
    const canvas = element.getBoundingClientRect();
    const caption = { x1: legend.left - canvas.left, x2: legend.right - canvas.left, y1: legend.top - canvas.top, y2: legend.bottom - canvas.top };
    const intersects = (a: typeof root, b: Pick<typeof root, 'x1' | 'x2' | 'y1' | 'y2'>) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
    return { label: intersects(root, label), caption: intersects(root, caption), text: cy.$id('Q20089181').style('label') };
  });
  expect(overlap.text).toContain('Lecornu');
  expect(overlap.label).toBe(false); expect(overlap.caption).toBe(false);
});
