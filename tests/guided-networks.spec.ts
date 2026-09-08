import { expect, test } from '@playwright/test';

test('guided cabinet journey preserves its step and leads to temporal comparison', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?graphView=system&systemLens=circles');
  await page.locator('.map-explore-tools > summary').click();
  await page.getByRole('button', { name: 'Équipes et promotions · visite guidée' }).click();
  await expect(page.getByRole('heading', { name: 'Équipes, promotions et parcours communs' })).toBeVisible();
  await page.getByLabel('Type de groupe').selectOption('cabinet');
  await page.getByRole('button', { name: /Cabinet de Pierre Moscovici/ }).click();
  await expect(page.getByRole('heading', { name: 'Alexis Kohler', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Étape suivante →' }).click();
  await expect(page).toHaveURL(/journeyStep=1/);
  await page.reload();
  const kohler = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Alexis Kohler', exact: true }) });
  await kohler.getByText('Suivre les étapes et leurs sources').click();
  await expect(kohler.getByText(/Cabinet d’Emmanuel Macron/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Étape suivante →' }).click();
  await page.evaluate(() => { document.documentElement.dataset.journeyDocument = 'preserved'; });
  await page.getByRole('link', { name: 'Se sont-ils croisés ? →' }).click();
  await expect(page.getByRole('region', { name: 'Se sont-ils croisés ?' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.journeyDocument)).toBe('preserved');
  await expect(page.getByText('Période commune documentée', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: '← Revenir à l’exploration guidée' }).click();
  await expect(page).toHaveURL(/systemLens=guided/);
  await expect(page).toHaveURL(/journey=bercy-moscovici-2012/);
  await expect(page.getByRole('heading', { name: 'Comparer deux parcours', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('promotion roster, sources, sharing and mobile layout', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?graphView=system&systemLens=guided&journey=ena-senghor-2004&journeyStep=0');
  await expect(page.getByRole('heading', { name: 'Emmanuel Macron', exact: true })).toBeVisible();
  await expect(page.locator('.guide-roster > article')).toHaveCount(4);
  await page.getByText('Lire la preuve d’appartenance', { exact: true }).first().click();
  await expect(page.locator('.guide-roster a[href*="JORFTEXT000000437029"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Partager cette étape' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Lien copié' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('journey=ena-senghor-2004');
  expect(copied).toContain('journeyStep=0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('promotion.png'), fullPage: true });
});

test('single-member promotion and invalid journey remain usable', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=guided&journey=faf-young-leaders-2011&journeyStep=2');
  await expect(page.getByText(/Un seul membre est documenté/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Se sont-ils croisés ? →' })).toHaveCount(0);
  await page.goto('/?graphView=system&systemLens=guided&journey=missing');
  await expect(page.getByLabel('Type de groupe')).toBeVisible();
  await page.getByLabel('Quel groupe explorer ?').fill('aucun groupe xyz');
  await expect(page.getByText(/Aucun groupe ne correspond/)).toBeVisible();
});

test('saved guided step restores without an unrelated detail panel', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=guided&journey=ena-senghor-2004&journeyStep=1');
  await page.getByRole('button', { name: 'Mes explorations', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Mes explorations', exact: true });
  await dialog.getByLabel('Nom de cette exploration').fill('La promotion Senghor');
  await dialog.getByRole('button', { name: 'Enregistrer cette vue', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.goto('/?root=Q3052772');
  await page.getByRole('button', { name: 'Mes explorations', exact: true }).click();
  await dialog.getByRole('button', { name: 'Restaurer La promotion Senghor', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Où les retrouve-t-on ensuite ?', exact: true })).toBeVisible();
  await expect(page.locator('.detail-panel')).toHaveCount(0);
  await expect(page).toHaveURL(/journeyStep=1/);
});
