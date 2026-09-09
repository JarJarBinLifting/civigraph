import { expect, test, type Page } from '@playwright/test';
import type { Core } from 'cytoscape';

type Canvas = HTMLElement & { _cyreg: { cy: Core } };
const bernard = 'Q560890';
const regional = 'Q16886136';
const initial = `/?root=${bernard}&selected=${regional}`;

async function centered(page: Page, id: string) {
  await expect.poll(() => page.locator('.graph-canvas').evaluate((element, id) => {
    const cy = (element as Canvas)._cyreg.cy;
    const node = cy.getElementById(id);
    const point = node.renderedPosition();
    // The focus is the layout origin; the camera balances the complete network.
    return node.hasClass('root') && Math.hypot(node.position().x, node.position().y) < 1 && point.x > 0 && point.x < cy.width() && point.y > 0 && point.y < cy.height() && !cy.nodes().filter(':animated').length && !cy.animated();
  }, id)).toBe(true);
}

test('the new center moves continuously, retains Bernard’s edge, and opens its neighbors', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Motion inspected at the viewport of the reported issue.');
  await page.setViewportSize({ width: 1982, height: 1103 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(initial);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const recording = await page.locator('.graph-canvas').evaluateHandle((element, ids) => {
    const cy = (element as Canvas)._cyreg.cy;
    const node = cy.getElementById(ids.regional);
    const edge = node.edgesWith(cy.getElementById(ids.bernard))[0];
    const samples: { x: number; y: number; edgeRetained: boolean }[] = [];
    const from = { ...node.position() };
    node.on('position', () => samples.push({ ...node.position(), edgeRetained: !edge.removed() }));
    return { cy, node: node[0], edge, from, samples };
  }, { bernard, regional });
  await page.getByRole('button', { name: 'Explorer autour de cette fiche', exact: true }).click();
  await centered(page, regional);
  const result = await recording.evaluate(recording => {
    const cy = (document.querySelector('.graph-canvas') as Canvas)._cyreg.cy;
    const distance = Math.hypot(recording.from.x, recording.from.y);
    const neighbors = cy.getElementById('Q16886136').neighborhood().nodes();
    const positions = neighbors.map(node => node.position());
    return {
      sameGraph: cy === recording.cy,
      sameNode: cy.getElementById('Q16886136')[0] === recording.node,
      intermediateFrames: recording.samples.filter(point => Math.hypot(point.x, point.y) > 1 && Math.hypot(point.x, point.y) < distance - 1).length,
      retainedThroughout: recording.samples.every(point => point.edgeRetained),
      previousStillConnected: !recording.edge.removed(),
      neighbors: neighbors.map(node => node.data('label')).sort(),
      minimumSpacing: Math.min(...positions.flatMap((point, i) => positions.slice(i + 1).map(other => Math.hypot(point.x - other.x, point.y - other.y)))),
      count: cy.nodes().length,
    };
  });
  expect(result.sameGraph).toBe(true);
  expect(result.sameNode).toBe(true);
  expect(result.intermediateFrames).toBeGreaterThan(3);
  expect(result.retainedThroughout).toBe(true);
  expect(result.previousStillConnected).toBe(true);
  expect(result.neighbors).toEqual(expect.arrayContaining(['Bernard Cazeneuve', 'Jean-Pierre Raffarin', 'Ségolène Royal']));
  expect(result.minimumSpacing).toBeGreaterThan(60);
  expect(result.count).toBe(15);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/pivot-regional-1982.png', fullPage: true });
  await page.goBack();
  await centered(page, bernard);
  await page.goForward();
  await centered(page, regional);
  await page.reload();
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await centered(page, regional);
});

test('legacy URLs restore their latest center and reduced motion skips the transition', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/?root=${bernard}&expanded=${bernard},${regional}&selected=${regional}`);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await centered(page, regional);
  if (info.project.name === 'mobile') {
    // Larger neighborhoods retain a readable zoom; the overview control fits them all.
    await page.getByRole('button', { name: 'Recentrer le graphe', exact: true }).click();
    expect(await page.locator('.graph-canvas').evaluate(element => {
      const cy = (element as Canvas)._cyreg.cy;
      const bounds = cy.nodes().renderedBoundingBox({ includeLabels: true });
      return bounds.x1 >= 0 && bounds.y1 >= 0 && bounds.x2 <= cy.width() && bounds.y2 <= cy.height();
    })).toBe(true);
  }
  await page.screenshot({ path: `test-results/pivot-reduced-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('tabpanel', { name: 'Connexions de l’entité' }).getByRole('button', { name: 'Bernard Cazeneuve', exact: true }).click();
  await page.getByRole('button', { name: 'Explorer autour de cette fiche', exact: true }).click();
  const result = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return { center: cy.$('node.root').id(), moving: cy.animated() || cy.nodes().filter(':animated').length > 0, position: cy.getElementById('Q560890').position() };
  });
  expect(result).toEqual({ center: bernard, moving: false, position: { x: 0, y: 0 } });
  await expect(page).toHaveURL(/expanded=Q560890&/);
});

test('a return during a transition cancels stale removals and keeps the restored graph usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Rapid navigation uses the desktop exploration rail.');
  await page.goto(initial);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Explorer autour de cette fiche', exact: true }).click();
  await page.getByRole('navigation', { name: 'Parcours d’exploration' }).getByRole('button', { name: 'Bernard Cazeneuve', exact: true }).click();
  await centered(page, bernard);
  await expect(page.locator('.graph-meta')).toContainText('21 entités');
  const result = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return { count: cy.nodes().length, leaving: cy.$('.leaving').length, visible: cy.nodes().every(node => Number(node.style('opacity')) === 1), connected: cy.getElementById('Q560890').edgesWith(cy.getElementById('Q16886136')).length > 0 };
  });
  expect(result).toEqual({ count: 21, leaving: 0, visible: true, connected: true });
  // Double-click remains another way to pivot after the interrupted transition.
  const point = await page.locator('.graph-canvas').evaluate(element => {
    const point = (element as Canvas)._cyreg.cy.getElementById('Q16886136').renderedPosition();
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x + point.x, y: bounds.y + point.y };
  });
  await page.mouse.dblclick(point.x, point.y);
  await centered(page, regional);
});
