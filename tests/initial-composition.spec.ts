import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';

type Canvas = HTMLElement & { _cyreg: { cy: Core } };

test('the initial exploration gives the network room and opens the profile on demand', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('complementary', { name: 'Fiche de Emmanuel Macron' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ouvrir la fiche', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Emmanuel Macron', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fermer la fiche', exact: true }).click();
  await expect(page.locator('.workspace')).toHaveClass(/detail-closed/);
  await page.reload();
  await expect(page.locator('.workspace')).toHaveClass(/detail-closed/);
});

test('a small asymmetric network uses the canvas without an empty mirrored margin', async ({ page }) => {
  await page.goto('/?root=Q3052772');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const framing = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const boxes = cy.nodes().map(node => node.renderedBoundingBox({ includeLabels: false, includeOverlays: false }));
    const x1 = Math.min(...boxes.map(box => box.x1)), x2 = Math.max(...boxes.map(box => box.x2));
    const y1 = Math.min(...boxes.map(box => box.y1)), y2 = Math.max(...boxes.map(box => box.y2));
    const guides = element.parentElement!.querySelector('.graph-guides > g')!.getBoundingClientRect();
    return {
      nodes: cy.nodes().length, edges: cy.edges().length,
      outside: boxes.filter(box => box.x1 < 0 || box.y1 < 0 || box.x2 > cy.width() || box.y2 > cy.height()).length,
      balance: Math.abs(x1 - (cy.width() - x2)) / cy.width(),
      // The temporal rings are part of the scene and must remain fully framed.
      occupied: Math.max((x2 - x1) / cy.width(), (y2 - y1) / cy.height(), guides.width / cy.width(), guides.height / cy.height()),
    };
  });
  expect(framing.nodes).toBe(17); expect(framing.edges).toBe(19);
  expect(framing.outside).toBe(0);
  expect(framing.balance).toBeLessThan(.18);
  expect(framing.occupied).toBeGreaterThan(.65);
});

test('a shared selection still opens the requested profile immediately', async ({ page }, info) => {
  await page.goto('/?root=Q3052772&focus=Q3052772&expanded=Q3052772&categories=education%2Coffice%2Cparty%2Cemployment%2Cmembership&selected=Q2986712&time=all');
  await expect(page.getByRole('heading', { name: 'Commission Attali', exact: true })).toBeVisible();
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: `.working/atlas-selected-${info.project.name}.png`, fullPage: true });
});

test('a laptop viewport keeps the graph controls visible and the legend available on demand', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop height constraint.');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const controls = await page.getByLabel('Contrôles du graphe').boundingBox();
  expect(controls!.y + controls!.height).toBeLessThanOrEqual(768);
  await expect(page.locator('.chronology-legend')).toBeHidden();
  await page.getByText('Lire les distances', { exact: true }).click();
  await expect(page.locator('.chronology-legend')).toBeVisible();
  await expect(page.locator('.chronology-explanation')).toContainText('L’année repère ne filtre pas les présences.');
  await page.getByText('Lire les distances', { exact: true }).click();
  await page.screenshot({ path: '.working/composition-laptop.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
