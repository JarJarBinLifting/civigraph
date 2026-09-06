import { expect, test } from '@playwright/test';
test('institutional paths expose directional evidence and restore their own comparison mode', async ({ page }, info) => {
  await page.goto('/?root=Q3052772&compare=Q3579995&comparisonMode=paths&mode=list');
  await expect(page.getByRole('button', { name: 'Chemins', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const paths = page.getByRole('region', { name: 'Chemins institutionnels' });
  await expect(paths).toContainText('Toutes périodes');
  const count = await paths.locator('.institution-path').count();
  expect(count).toBeGreaterThan(0); expect(count).toBeLessThanOrEqual(3);
  const first = paths.locator('.institution-path').first();
  await first.locator('summary').first().click();
  await expect(first.locator('.evidence-card').first()).toContainText('Emmanuel Macron');
  await expect(first.getByRole('link', { name: 'Déclaration Wikidata', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Partager la vue', exact: true }).click();
  const url = await page.getByLabel('Lien vers cette vue').inputValue();
  expect(url).toContain('comparisonMode=paths'); expect(url).toContain('mode=list');
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Chemins', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await paths.locator('.institution-path').first().screenshot({ path: `.working/sprint/lot2b-path-${info.project.name}.png`, scale: 'css' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const emptyFilters = new URL(url);
  emptyFilters.searchParams.set('categories', '');
  await page.goto(emptyFilters.toString());
  await expect(paths).toContainText('Aucun chemin trouvé dans le corpus avec ces filtres et cette profondeur');
});

test('an indirect path in the real corpus reaches its institution and exposes every segment', async ({ page }) => {
  await page.goto('/?root=Q3052772&compare=Q12927&comparisonMode=paths');
  const path = page.locator('.institution-path').first();
  await expect(path).toBeVisible();
  await expect(path.locator('.path-chain li')).toHaveCount(5);
  await expect(path.locator('summary')).toHaveCount(4);
  await path.locator('summary').nth(1).click();
  await expect(path.locator('details').nth(1).getByRole('link').first()).toBeVisible();
  await path.locator('.path-chain button').nth(1).click();
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  expect(new URL(page.url()).searchParams.get('compare')).toBeNull();
});
