import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';
import coverage from '../docs/data-coverage.json' with { type: 'json' };

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

test('real mouse hover reaches points through edges and preserves the selection after zoom', async ({ page, isMobile }, testInfo) => {
  test.skip(isMobile, 'A touch screen has no mouse hover.');
  await page.goto('/?graphView=system&systemLens=entities');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const canvas = page.locator('.system-stage .graph-canvas');
  await page.waitForTimeout(350);
  type ObservedCanvas = Canvas & { hoverStyleEvents: string[]; lastGraphChange: number };
  await canvas.evaluate(element => {
    const host = element as ObservedCanvas;
    host.hoverStyleEvents = []; host.lastGraphChange = performance.now();
    const images = new Map(host._cyreg.cy.nodes().map(n => [n.id(), n.is(':backgrounding')]));
    host._cyreg.cy.on('style', event => {
      const node = event.target;
      host.lastGraphChange = performance.now();
      // The renderer updates :backgrounding when a badge image loads. This is not a hover restyle.
      if (node.isNode()) {
        const previous = images.get(node.id()), current = node.is(':backgrounding');
        images.set(node.id(), current);
        if (previous !== current) return;
      }
      host.hoverStyleEvents.push(node.id());
    });
    host._cyreg.cy.on('pan zoom', () => { host.lastGraphChange = performance.now(); });
  });
  const pointerTargets = () => canvas.evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy, rect = element.getBoundingClientRect();
    const nodes = cy.nodes().map(n => ({
      id: n.id(), name: String(n.data('label')), visible: n.visible(), position: n.renderedPosition(), label: n.style('label'),
      body: n.renderedBoundingBox({ includeLabels: false, includeOverlays: false, includeUnderlays: false }),
      text: n.renderedBoundingBox({ includeNodes: false, includeEdges: false, includeOverlays: false, includeUnderlays: false }),
    })).filter(n => n.visible);
    const within = (x: number, y: number, box: { x1: number; y1: number; x2: number; y2: number }) => x >= box.x1 - 3 && x <= box.x2 + 3 && y >= box.y1 - 3 && y <= box.y2 + 3;
    // Use exposed point centers, excluding points actually covered by another point or card.
    // Read coordinates only: every interaction below uses the browser's real mouse.
    return nodes.filter(n => !n.label && n.position.x > 12 && n.position.x < rect.width - 12 && n.position.y > 12 && n.position.y < rect.height - 12
      && !nodes.some(other => other.id !== n.id && (within(n.position.x, n.position.y, other.body) || other.label && within(n.position.x, n.position.y, other.text))))
      .slice(0, 6).map(n => ({ id: n.id, name: n.name, x: rect.x + n.position.x, y: rect.y + n.position.y }));
  });
  let selected: { id: string; name: string; x: number; y: number } | undefined;
  for (const stage of ['overview', 'selected', 'zoomed']) {
    if (stage === 'selected') {
      await page.mouse.click(selected!.x, selected!.y);
      await expect(page.getByRole('heading', { name: selected!.name, exact: true })).toBeVisible();
      await expect(page.locator('.system-selection-tools')).toBeVisible();
    } else if (stage === 'zoomed') {
      await page.getByRole('button', { name: 'Zoom avant', exact: true }).click();
    }
    // Wait for the actual camera refinement, rather than a fixed animation delay.
    await expect.poll(() => canvas.evaluate(element => {
      const host = element as ObservedCanvas, cy = host._cyreg.cy;
      return !cy.animated() && performance.now() - host.lastGraphChange > 250;
    })).toBe(true);
    const targets = await pointerTargets();
    expect(targets).toHaveLength(6);
    selected ??= targets[0];
    await canvas.evaluate(element => { (element as ObservedCanvas).hoverStyleEvents = []; });
    for (const target of targets) {
      await page.mouse.move(10, 160);
      await page.mouse.move(target.x, target.y, { steps: 6 });
      await expect(canvas).toHaveAttribute('data-hovered', target.id);
      await expect(canvas).toHaveAttribute('title', target.name);
      await expect(canvas.locator('.system-hover-overlay')).toBeVisible();
    }
    expect(await canvas.evaluate(element => (element as ObservedCanvas).hoverStyleEvents), stage).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`hover-${stage}.png`) });
    const card = await canvas.evaluate(element => {
      const cy = (element as Canvas)._cyreg.cy, rect = element.getBoundingClientRect();
      return cy.nodes().filter(n => n.visible() && n.style('label') !== '').map(n => {
        const box = n.renderedBoundingBox({ includeNodes: false, includeEdges: false, includeOverlays: false, includeUnderlays: false });
        return { id: n.id(), x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2 };
      }).filter(n => n.x > 12 && n.x < rect.width - 12 && n.y > 12 && n.y < rect.height - 12)
        .map(n => ({ id: n.id, x: n.x + rect.x, y: n.y + rect.y }))[0];
    });
    expect(card).toBeDefined();
    await page.mouse.move(card.x, card.y, { steps: 6 });
    await expect(canvas).toHaveAttribute('data-hovered', card.id);
    await page.mouse.move(10, 10);
    await expect(canvas.locator('.system-hover-overlay')).toBeHidden();
    await expect(canvas).toHaveAttribute('title', '');
    await page.mouse.move(card.x, card.y);
    await expect(canvas).toHaveAttribute('data-hovered', card.id);
    await page.mouse.move(10, 10);
    await expect(canvas.locator('.system-hover-overlay')).toBeHidden();
    if (stage === 'overview') await expect(canvas).toHaveAttribute('data-highlighted', '0');
    else expect(await canvas.evaluate((element, id) => (element as Canvas)._cyreg.cy.$id(id).hasClass('system-selected'), selected.id)).toBe(true);
  }
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
  await page.getByRole('button', { name: 'Vue d’ensemble', exact: true }).click();
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
  await expect(canvas).toHaveAttribute('data-nodes', String(coverage.entities));
  await page.getByRole('button', { name: 'Zoom avant', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter la carte en PNG', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await expect(page.locator('.graph-export-message')).toContainText('PNG exporté');
});
