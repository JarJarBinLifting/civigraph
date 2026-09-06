import { expect, test, type Page } from '@playwright/test';
import type { Core } from 'cytoscape';
import integrity from '../src/data/integrity-watch.json' with { type: 'json' };

type Canvas = HTMLElement & { _cyreg: { cy: Core } };
const areva = '/?root=Q5829&focus=Q455484&expanded=Q5829,Q170972,Q3579995,Q455484&selected=Q455484&time=same&period=Q3579995%243b71cf9c-495e-fc6e-3d01-6ec6bd6db055';
async function ready(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => page.locator('.graph-canvas').evaluate(element => !(element as Canvas)._cyreg.cy.animated())).toBe(true);
}
async function graph(page: Page) {
  return page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    return { center: cy.$('node.root').id(), nodes: cy.nodes().not('.leaving').map(node => node.id()), edges: cy.edges().not('.leaving').length };
  });
}
test('Areva continues through dated and undated people without claiming co-presence', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1982, height: 1103 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page, areva);
  expect((await graph(page)).nodes).toEqual(expect.arrayContaining(['Q469310', 'Q3123589', 'Q3579995']));
  expect((await graph(page)).nodes).not.toContain('Q3092308');
  await page.locator('.uncertain-connections summary').click();
  await expect(page.getByRole('button', { name: 'Félicité Herzog', exact: true })).toBeVisible();
  await expect(page.locator('.uncertain-connections')).toContainText('n’est pas établie');
  await expect(page.getByRole('button', { name: 'Même période', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: `test-results/enrichment-areva-${info.project.name}.png`, fullPage: true });
  if (info.project.name === 'mobile') expect(await page.locator('.graph-canvas').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(430);
  await page.getByRole('button', { name: 'Explorer la carrière de Félicité Herzog', exact: true }).click();
  await expect.poll(async () => (await graph(page)).center).toBe('Q3092308');
  expect(new URL(page.url()).searchParams.get('time')).toBe('all');
  expect(new URL(page.url()).searchParams.has('period')).toBe(false);
  expect((await graph(page)).edges).toBeGreaterThan(1);
  const url = page.url();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Même période', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await ready(page, url);
  expect((await graph(page)).center).toBe('Q3092308');
  expect(new URL(page.url()).searchParams.get('time')).toBe('all');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Integrity Watch activities show the original HATVP declaration and precise provenance', async ({ page }, info) => {
  const relation = integrity.relations.find(relation => relation.target === 'Q273535')!;
  await ready(page, `/?root=${relation.source}&selected=${relation.source}&edge=${encodeURIComponent(relation.id)}`);
  await expect(page.locator('.evidence-card')).toContainText('Enseignement et recherche');
  await expect(page.locator('.evidence-card')).toContainText('janv. 2020 – juil. 2022');
  await expect(page.locator('.evidence-card')).toContainText('Integrity Watch France');
  await expect(page.getByRole('link', { name: 'Consulter la déclaration HATVP', exact: true })).toHaveAttribute('href', relation.statementUrl);
  await expect(page.getByRole('link', { name: 'Version lors de l’import', exact: true })).toHaveCount(0);
  await page.screenshot({ path: `test-results/enrichment-hatvp-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('official parliamentary bodies have navigable mandates and their own source', async ({ page }) => {
  await ready(page, '/?root=Q3579995&focus=AN:PO419865&expanded=Q3579995,AN:PO419865&selected=AN:PO419865&time=same&period=AN:PM657164:PO419865');
  expect((await graph(page)).nodes.length).toBeGreaterThan(2);
  expect(await page.locator('.graph-canvas').evaluate(element => (element as Canvas)._cyreg.cy.$('node.root').data('label'))).toBe('Développement durable');
  await expect(page.locator('.entity-profile')).toContainText("Commission du développement durable et de l'aménagement du territoire");
  await expect(page.locator('.entity-profile').getByRole('link', { name: 'Assemblée nationale', exact: true })).toHaveAttribute('href', 'https://data.assemblee-nationale.fr/acteurs/historique-des-deputes');
  await page.getByRole('button', { name: 'Source de la période', exact: true }).click();
  await expect(page.locator('.evidence-card')).toContainText('PM657164');
  await expect(page.locator('.evidence-card')).toContainText('28 juin 2012 – 30 sept. 2013');
});

test('a school opens a sourced promotion and its larger corpus remains accessible', async ({ page }, info) => {
  await ready(page, '/?root=Q3052772&focus=Q273579&expanded=Q3052772,Q273579&selected=Q273579');
  await expect(page.locator('#exploration-period')).toHaveValue('ena-senghor-2004-Q3052772');
  expect((await graph(page)).nodes).toEqual(expect.arrayContaining(['Q1457778', 'Q30348845', 'Q18744966']));
  await page.getByRole('button', { name: 'Toutes les périodes', exact: true }).click();
  await expect(page.locator('.graph-meta')).toContainText('123 entités');
  await expect.poll(async () => (await graph(page)).nodes.length).toBe(123);
  await expect(page.getByRole('navigation', { name: 'Pages du réseau' })).toHaveCount(0);
  expect((await graph(page)).nodes).toContain('Q3052772');
  await page.reload();
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  expect((await graph(page)).nodes.length).toBe(123);
  await page.screenshot({ path: `test-results/enrichment-dense-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Liste', exact: true }).click();
  await expect(page.locator('.graph-list')).toContainText('Promotion Senghor');
  expect(await page.locator('.graph-list > article').count()).toBeGreaterThan(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
