import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page, query = '') {
  await page.goto(`/${query}`);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
}
async function filters(page: Page) {
  const button = page.getByRole('button', { name: 'Filtres', exact: true });
  if (await button.isVisible()) await button.click();
}
async function closeFilters(page: Page) {
  const button = page.getByRole('button', { name: 'Fermer les filtres', exact: true });
  if (await button.isVisible()) await button.click();
}

test('initial graph, complete corpus and source transparency', async ({ page }, info) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4300')) externalRequests.push(request.url()); });
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Emmanuel Macron', exact: true })).toBeVisible();
  await expect(page.getByText('16 liens', { exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/${info.project.name}-explorer.png`, fullPage: true });
  await page.getByRole('button', { name: 'Voir la source du lien avec ENA', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Déclaration Wikidata', exact: true })).toHaveAttribute('href', /wikidata\.org\/wiki\/Q3052772#/);
  await expect(page.getByText('2002 – 2004', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Version lors de l’import', exact: true })).toHaveAttribute('href', /oldid=\d+/);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('search accepts accents omitted and explains absent results', async ({ page }) => {
  await ready(page);
  const search = page.getByRole('combobox', { name: 'Rechercher une personne ou une organisation' });
  await search.fill('Personne introuvable 123');
  await expect(page.getByText(/Aucun résultat dans ce corpus/)).toBeVisible();
  await search.fill('edouard philippe');
  await search.press('Enter');
  await expect(page.getByRole('heading', { name: 'Édouard Philippe', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/root=Q3579995/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Emmanuel Macron', exact: true })).toBeVisible();
});

test('every filter can be disabled and restored', async ({ page }) => {
  await ready(page);
  await filters(page);
  await page.getByRole('button', { name: 'Tout masquer', exact: true }).click();
  await expect(page.getByText('0 liens', { exact: true })).toBeVisible();
  await closeFilters(page);
  await page.getByRole('button', { name: 'Liste', exact: true }).click();
  await expect(page.getByText('Aucune relation affichée', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Afficher toutes les catégories', exact: true }).click();
  await expect(page.getByText('16 liens', { exact: true })).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: 'Emmanuel Macron' }).first()).toBeVisible();
});

test('canvas node click and expansion add the school’s sourced neighbors', async ({ page }) => {
  await ready(page);
  // Obtain the rendered position from Cytoscape, then exercise real pointer input.
  const position = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as HTMLElement & { _cyreg: { cy: { getElementById(id: string): { renderedPosition(): { x: number; y: number } } } } })._cyreg.cy;
    const point = cy.getElementById('Q273579').renderedPosition();
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x + point.x, y: bounds.y + point.y };
  });
  await page.mouse.click(position.x, position.y);
  await expect(page.getByRole('heading', { name: 'ENA', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Développer ce réseau', exact: true }).click();
  await expect(page).toHaveURL(/expanded=Q3052772%2CQ273579/);
  await expect(page.getByRole('button', { name: 'Réseau développé', exact: true })).toBeDisabled();
  const nodeCount = await page.locator('.graph-meta').innerText();
  expect(Number(nodeCount.match(/(\d+) entités/)?.[1])).toBeGreaterThan(25);
});

test('comparison exposes both proofs and responds to filters', async ({ page }, info) => {
  await ready(page);
  await page.getByRole('navigation').getByRole('button', { name: 'Comparer', exact: true }).click();
  const search = page.getByRole('combobox', { name: 'Deuxième personne à comparer' });
  await search.fill('edouard');
  await search.press('Enter');
  await expect(page.getByText('3 points communs documentés', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ENA', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Déclaration Wikidata', exact: true })).toHaveCount(6);
  await page.screenshot({ path: `test-results/${info.project.name}-comparison.png`, fullPage: true });
  await filters(page);
  await page.getByRole('checkbox', { name: /Partis & statuts/ }).uncheck();
  await expect(page.getByText('2 points communs documentés', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: /Formations/ }).uncheck();
  await expect(page.getByText('Aucun point commun dans cette vue', { exact: true })).toBeVisible();
});

test('share URL restores filters, expansion, selection and list mode', async ({ page }) => {
  await ready(page, '?root=Q3052772&expanded=Q3052772,Q273579&categories=education&selected=Q273579');
  await page.getByRole('button', { name: 'Liste', exact: true }).click();
  await page.getByRole('button', { name: 'Partager la vue', exact: true }).click();
  const url = await page.getByLabel('Lien vers cette vue').inputValue();
  expect(url).toContain('mode=list');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copier', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copié', exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'ENA', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Liste', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await filters(page);
  await expect(page.getByRole('checkbox', { name: /Formations/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Fonctions publiques/ })).not.toBeChecked();
});

test('invalid parameters recover and layout has no horizontal overflow', async ({ page }) => {
  await ready(page, '?root=unknown&selected=bad&compare=bad&categories=bad&edge=bad');
  await expect(page.getByRole('heading', { name: 'Emmanuel Macron', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'À propos de Civigraph', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/Les déclarations Wikidata ne sont pas vérifiées indépendamment/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('shared comparison restores both people and exploring a common entity shares a graph view', async ({ page }) => {
  await page.goto('/?root=Q3052772&compare=Q3579995');
  await expect(page.getByText('3 points communs documentés', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Partager la vue', exact: true }).click();
  const comparisonUrl = await page.getByLabel('Lien vers cette vue').inputValue();
  await page.goto(comparisonUrl);
  await expect(page.getByText('3 points communs documentés', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explorer ENA', exact: true }).click();
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Partager la vue', exact: true }).click();
  const graphUrl = await page.getByLabel('Lien vers cette vue').inputValue();
  expect(new URL(graphUrl).searchParams.has('compare')).toBe(false);
  await page.goto(graphUrl);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('heading', { name: 'ENA', exact: true })).toBeVisible();
});
