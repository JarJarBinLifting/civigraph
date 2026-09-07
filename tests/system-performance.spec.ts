import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';

type Canvas = HTMLElement & { _cyreg: { cy: Core } };

test('continuous panning preserves geometry without restyling the whole corpus', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=entities');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const canvas = page.locator('.system-stage .graph-canvas');
  await page.waitForTimeout(350);
  const result = await canvas.evaluate(async element => {
    const cy = (element as Canvas)._cyreg.cy;
    const geometry = cy.nodes().map(n => ({ id: n.id(), position: { ...n.position() }, width: n.width() }));
    let styled = 0;
    const count = () => { styled++; };
    cy.on('style', count);
    for (let i = 0; i < 8; i++) {
      cy.panBy({ x: 4, y: 0 });
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    cy.off('style', count);
    return { styled, unchanged: geometry.every(n => {
      const current = cy.$id(n.id);
      return current.position('x') === n.position.x && current.position('y') === n.position.y && current.width() === n.width;
    }) };
  });
  expect(result.unchanged).toBe(true);
  expect(result.styled).toBe(0);
});

test('rapid hover settles on the last entity and leaving restores the selection', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=entities');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const canvas = page.locator('.system-stage .graph-canvas');
  const ids = await canvas.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const [a, b] = cy.nodes().slice(0, 2).map(n => n.id());
    cy.$id(a).emit('mouseover'); cy.$id(a).emit('mouseout'); cy.$id(b).emit('mouseover');
    return { a, b, near: cy.$id(b).closedNeighborhood().nodes().length };
  });
  await expect.poll(() => canvas.evaluate((element, id) => (element as Canvas)._cyreg.cy.$id(id).hasClass('system-selected'), ids.b)).toBe(true);
  await expect(canvas).toHaveAttribute('data-highlighted', String(ids.near));
  await canvas.evaluate((element, id) => {
    const cy = (element as Canvas)._cyreg.cy;
    cy.$id(id).emit('tap'); cy.$id(id).emit('mouseout');
  }, ids.a);
  await expect(page.locator('.system-selection-tools')).toBeVisible();
  await expect.poll(() => canvas.evaluate((element, id) => (element as Canvas)._cyreg.cy.$id(id).hasClass('system-selected'), ids.a)).toBe(true);
});

test('labels settle at readable sizes after zoom and the camera survives switching views', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=entities');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const canvas = page.locator('.system-stage .graph-canvas');
  await page.getByRole('button', { name: 'Zoom avant', exact: true }).click();
  await expect.poll(() => canvas.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const labels = cy.nodes().filter(n => n.style('label') !== '');
    return labels.length > 0 && labels.every(n => {
      const font = parseFloat(n.style('font-size')) * cy.zoom();
      return font >= 13.9 && font <= 15.1;
    });
  })).toBe(true);
  const before = await canvas.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return { zoom: cy.zoom(), x: (cy.width() / 2 - cy.pan().x) / cy.zoom(), y: (cy.height() / 2 - cy.pan().y) / cy.zoom(), nodes: cy.nodes().length, edges: cy.edges().length };
  });
  await page.getByRole('button', { name: 'Centrée', exact: true }).click();
  await expect(page.getByTestId('system-graph-stage')).toHaveCount(0);
  await page.getByRole('button', { name: 'Système', exact: true }).click();
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const after = await canvas.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return { zoom: cy.zoom(), x: (cy.width() / 2 - cy.pan().x) / cy.zoom(), y: (cy.height() / 2 - cy.pan().y) / cy.zoom(), nodes: cy.nodes().length, edges: cy.edges().length };
  });
  expect(after.nodes).toBe(before.nodes); expect(after.edges).toBe(before.edges);
  expect(after.zoom).toBeCloseTo(before.zoom, 5);
  expect(after.x).toBeCloseTo(before.x, 5); expect(after.y).toBeCloseTo(before.y, 5);
});

test('selection, two-step neighbors, filters and PNG export remain usable', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=entities');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const canvas = page.locator('.system-stage .graph-canvas');
  await canvas.evaluate(element => (element as Canvas)._cyreg.cy.$id('Q3052772').emit('tap'));
  await expect(page.getByRole('heading', { name: 'Emmanuel Macron', exact: true })).toBeVisible();
  const near = await canvas.evaluate(element => (element as Canvas)._cyreg.cy.$id('Q3052772').closedNeighborhood().nodes().length);
  await expect(canvas).toHaveAttribute('data-highlighted', String(near));
  await page.getByRole('button', { name: 'Voisins à deux étapes', exact: true }).click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-highlighted'))).toBeGreaterThan(near);
  await page.getByRole('button', { name: 'Filtres', exact: true }).click();
  await page.getByRole('button', { name: 'Tout masquer', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-nodes', '1');
  await expect(canvas).toHaveAttribute('data-connections', '0');
  await page.getByRole('button', { name: 'Tout afficher', exact: true }).click();
  await page.getByRole('button', { name: 'Fermer les filtres', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-nodes', '2394');
  await page.getByRole('button', { name: 'Zoom avant', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter la carte en PNG', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await expect(page.locator('.graph-export-message')).toContainText('PNG exporté');
});
