import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';
type Canvas = HTMLElement & { _cyreg: { cy: Core } };

test('adjacent time bands leave breathing room between ENA and Commission Attali', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Reported desktop graph spacing.');
  await page.setViewportSize({ width: 1024, height: 1103 });
  await page.goto('/');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  for (const zoom of [null, .55]) {
    if (zoom) {
      await page.locator('.graph-canvas').evaluate((element, zoom) => {
        const cy = (element as Canvas)._cyreg.cy;
        cy.zoom({ level: zoom, renderedPosition: cy.nodes('.root')[0].renderedPosition() });
      }, zoom);
    }
    await expect.poll(() => page.locator('.graph-canvas').evaluate(element => {
      const cy = (element as Canvas)._cyreg.cy;
      const ena = cy.$id('Q273579').renderedBoundingBox({ includeLabels: false, includeOverlays: false });
      const attali = cy.$id('Q2986712').renderedBoundingBox({ includeLabels: false, includeOverlays: false });
      const dx = Math.max(0, attali.x1 - ena.x2, ena.x1 - attali.x2);
      const dy = Math.max(0, attali.y1 - ena.y2, ena.y1 - attali.y2);
      return Math.hypot(dx, dy);
    })).toBeGreaterThanOrEqual(24);
  }
  await page.screenshot({ path: '.working/atlas-node-spacing.png', fullPage: true });
});

test('the map leads the initial desktop view with recognizable nodes and readable names', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop composition.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('complementary', { name: 'Filtres et parcours' })).toBeHidden();
  const metrics = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const names = cy.nodes().filter(node => Number(node.style('text-opacity')) > 0);
    return { width: cy.width(), height: cy.height(), named: names.length, total: cy.nodes().length,
      centerSize: cy.nodes('.root')[0].renderedWidth(),
      smallest: Math.min(...cy.nodes().not('.root').map(node => node.renderedWidth())),
      text: Math.min(...names.map(node => Number.parseFloat(node.style('font-size')) * cy.zoom())),
    };
  });
  expect(metrics.width).toBeGreaterThan(1300);
  expect(metrics.height).toBeGreaterThan(440);
  expect(metrics.total).toBe(17);
  expect(metrics.named).toBe(metrics.total);
  expect(metrics.centerSize).toBeGreaterThanOrEqual(75);
  expect(metrics.smallest).toBeGreaterThanOrEqual(43);
  expect(metrics.text).toBeGreaterThanOrEqual(15.9);
  await page.screenshot({ path: '.working/atlas-desktop.png', fullPage: true });
});

test('enlarging the map scales the network and restores the previous camera on exit', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop enlarged composition.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const camera = () => page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return { zoom: cy.zoom(), x: (cy.width() / 2 - cy.pan().x) / cy.zoom(), y: (cy.height() / 2 - cy.pan().y) / cy.zoom(), nodes: cy.nodes().length };
  });
  const before = await camera();
  await page.getByRole('button', { name: 'Agrandir la carte', exact: true }).click();
  // Sector layouts can become width-limited before using the entire extra height.
  await expect.poll(async () => (await camera()).zoom).toBeGreaterThan(before.zoom * 1.1);
  expect((await camera()).nodes).toBe(before.nodes);
  await page.screenshot({ path: '.working/atlas-enlarged.png', fullPage: true });
  await page.getByRole('button', { name: 'Réduire la carte', exact: true }).click();
  await expect.poll(async () => {
    const after = await camera();
    return Math.abs(after.zoom - before.zoom) + Math.abs(after.x - before.x) + Math.abs(after.y - before.y);
  }).toBeLessThan(.01);
});

test('the filter drawer remains keyboard accessible and keeps its selection when closed', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: `.working/atlas-initial-${info.project.name}.png`, fullPage: true });
  const trigger = page.getByRole('button', { name: 'Filtres', exact: true });
  await trigger.click();
  const rail = page.getByRole('complementary', { name: 'Filtres et parcours' });
  await expect(rail).toBeVisible();
  await rail.getByRole('checkbox', { name: /Formations/ }).uncheck();
  await page.keyboard.press('Escape');
  await expect(rail).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(rail.getByRole('checkbox', { name: /Formations/ })).not.toBeChecked();
  await rail.getByRole('button', { name: 'Fermer les filtres', exact: true }).click();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
