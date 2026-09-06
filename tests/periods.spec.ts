import { expect, test, type Page } from '@playwright/test';
import type { Core } from 'cytoscape';

type Canvas = HTMLElement & { _cyreg: { cy: Core } };
const attaliUrl = '/?root=Q3052772&focus=Q2986712&expanded=Q3052772,Q2986712&selected=Q2986712';

async function ready(page: Page, url = attaliUrl) {
  await page.goto(url);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
}
async function graph(page: Page) {
  return page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return { nodes: cy.nodes().not('.leaving').map(node => node.id()).sort(), edges: cy.edges().not('.leaving').length, center: cy.$('node.root').id() };
  });
}

test('Attali shows sourced compositions, role changes and the matching graph and list', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1982, height: 1103 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  const period = page.locator('#exploration-period');
  await expect(period).toHaveValue('attali-2007-Q3052772');
  await expect(page.getByRole('button', { name: 'Même période', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.detail-panel')).toContainText('Rapporteur général adjoint');
  await expect.poll(() => graph(page)).toEqual({ center: 'Q2986712', edges: 6, nodes: ['Q2986712', 'Q3052772', 'Q364315', 'Q438185', 'Q47904', 'Q74191', 'Q929763'] });
  await expect(page.locator('.period-summary')).toContainText('6 liens sans période exploitable');
  if (info.project.name === 'mobile') {
    expect(await page.locator('.graph-canvas').evaluate(element => {
      const cy = (element as Canvas)._cyreg.cy;
      const canvas = element.getBoundingClientRect();
      const bottom = cy.nodes().renderedBoundingBox({ includeLabels: true }).y2 + canvas.y;
      const hint = document.querySelector('.graph-tip')!.getBoundingClientRect();
      return bottom + 5 < hint.top;
    })).toBe(true);
  }
  await page.screenshot({ path: `test-results/periods-2007-${info.project.name}.png`, fullPage: true });
  await period.selectOption('attali-2010-Q3052772');
  await expect.poll(() => graph(page)).toEqual({ center: 'Q2986712', edges: 4, nodes: ['Q2986712', 'Q3052772', 'Q364315', 'Q74191', 'Q929763'] });
  await expect(page.locator('.detail-panel')).not.toContainText('Rapporteur général adjoint');
  await expect(page.locator('.detail-panel .connection-row')).toHaveCount(4);
  await page.getByRole('button', { name: 'Liste', exact: true }).click();
  await expect(page.locator('.graph-list > article')).toHaveCount(4);
  await expect(page.locator('.graph-list')).toContainText('2010 · Seconde mission');
  await page.getByRole('button', { name: 'Toutes les périodes', exact: true }).click();
  await expect(page.locator('.graph-list > article')).toHaveCount(16);
  await expect(page.locator('.graph-list')).toContainText('Période non renseignée');
  await page.getByRole('button', { name: 'Même période', exact: true }).click();
  await expect(page.locator('.graph-list > article')).toHaveCount(4);
  await page.getByRole('button', { name: 'Source de la période', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Consulter le document officiel', exact: true })).toHaveAttribute('href', 'https://www.vie-publique.fr/files/rapport/pdf/104000541.pdf#page=214');
  await expect(page.locator('.evidence-card')).toContainText('Attesté en 2010');
  await expect(page.locator('.evidence-card')).toContainText('Page imprimée 213');
  await expect(page.getByRole('link', { name: 'Version lors de l’import', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `test-results/periods-evidence-${info.project.name}.png`, fullPage: true });
});

test('the selected period survives sharing, history and continued exploration', async ({ page }) => {
  await ready(page);
  await page.locator('#exploration-period').selectOption('attali-2010-Q3052772');
  await page.getByRole('button', { name: 'Toutes les périodes', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Même période', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#exploration-period')).toHaveValue('attali-2010-Q3052772');
  await page.goForward();
  await expect(page.getByRole('button', { name: 'Toutes les périodes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Partager la vue', exact: true }).click();
  const url = await page.getByLabel('Lien vers cette vue').inputValue();
  expect(new URL(url).searchParams.get('period')).toBe('attali-2010-Q3052772');
  expect(new URL(url).searchParams.get('time')).toBe('all');
  await ready(page, url);
  await expect(page.getByRole('button', { name: 'Toutes les périodes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Même période', exact: true }).click();
  await page.getByRole('button', { name: 'Evelyne Gebhardt', exact: true }).click();
  await page.getByRole('button', { name: 'Développer ce réseau', exact: true }).click();
  await expect.poll(async () => (await graph(page)).center).toBe('Q74191');
  await expect(page).toHaveURL(/period=attali-2010-Q3052772/);
  await expect(page.getByRole('heading', { name: 'Evelyne Gebhardt', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Toutes les périodes', exact: true }).click();
  await expect.poll(async () => (await graph(page)).edges).toBeGreaterThan(4);
  await page.getByRole('button', { name: 'Civigraph, revenir à l’exploration initiale', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Exploration par période', exact: true })).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has('period')).toBe(false);
});

test('the same temporal controls cover schools, companies and missing dates', async ({ page }) => {
  await ready(page, '/?root=Q3052772&expanded=Q3052772,Q273579&selected=Q273579');
  await expect(page.locator('#exploration-period')).toContainText('2002 – 2004');
  await expect(page.getByRole('button', { name: 'Même période', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const schoolCount = (await graph(page)).edges;
  await page.getByRole('button', { name: 'Toutes les périodes', exact: true }).click();
  await expect.poll(async () => (await graph(page)).edges).toBeGreaterThan(schoolCount);
  await ready(page, '/?root=Q3052772&expanded=Q3052772,Q3022385&selected=Q3022385');
  await expect(page.locator('#exploration-period')).toContainText('2008 – 2012');
  await expect(page.getByRole('button', { name: 'Même période', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await graph(page)).center).toBe('Q3022385');
  await ready(page, '/?root=Q3052772&expanded=Q3052772,Q3075672&selected=Q3075672');
  await expect(page.getByRole('button', { name: 'Même période', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Toutes les périodes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.period-empty')).toContainText('n’a pas de période exploitable');
  await expect.poll(async () => (await graph(page)).edges).toBeGreaterThan(0);
});

test('adding temporal controls preserves the animated pivot and an existing Macron link', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Continuous motion checked at the reported desktop viewport.');
  await page.setViewportSize({ width: 1982, height: 1103 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page, '/?root=Q3052772&selected=Q2986712');
  const recording = await page.locator('.graph-canvas').evaluateHandle(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const node = cy.getElementById('Q2986712');
    const edge = cy.getElementById('attali-2007-Q3052772');
    const from = { ...node.position() };
    const samples: { x: number; y: number; retained: boolean }[] = [];
    node.on('position', () => samples.push({ ...node.position(), retained: !edge.removed() }));
    return { cy, node: node[0], from, samples };
  });
  await page.getByRole('button', { name: 'Développer ce réseau', exact: true }).click();
  await expect.poll(() => page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const node = cy.getElementById('Q2986712');
    return node.hasClass('root') && Math.hypot(node.position().x, node.position().y) < .1 && Math.abs(node.renderedPosition().y - cy.height() / 2) < 1 && !cy.animated() && !cy.nodes().filter(':animated').length;
  })).toBe(true);
  const result = await recording.evaluate(recording => {
    const cy = (document.querySelector('.graph-canvas') as Canvas)._cyreg.cy;
    const distance = Math.hypot(recording.from.x, recording.from.y);
    return { sameGraph: cy === recording.cy, sameNode: cy.getElementById('Q2986712')[0] === recording.node, intermediate: recording.samples.filter(p => Math.hypot(p.x, p.y) > 1 && Math.hypot(p.x, p.y) < distance - 1).length, retained: recording.samples.every(p => p.retained) };
  });
  expect(result.sameGraph).toBe(true);
  expect(result.sameNode).toBe(true);
  expect(result.intermediate).toBeGreaterThan(3);
  expect(result.retained).toBe(true);
});
