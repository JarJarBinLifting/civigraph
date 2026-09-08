import { expect, test } from '@playwright/test';

test('discover a shared circle, read evidence, and restore the dated reading', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?graphView=system&systemLens=circles');
  await expect(page.getByRole('heading', { name: 'Quels cercles partagent-ils ?' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Rechercher un cercle' }).fill('French-American');
  await page.getByRole('button', { name: /^French-American Foundation/ }).click();
  await expect(page.locator('.circle-detail h3')).toHaveText('French-American Foundation');
  await expect(page.getByTestId('analysis-map').locator('canvas').first()).toBeVisible();
  await page.locator('.crossing-proof details > summary').first().click();
  await expect(page.locator('.crossing-proof a[href^="https://"]').first()).toBeVisible();
  await page.screenshot({ path: info.outputPath('circle-evidence.png'), fullPage: true });
  await page.getByRole('combobox', { name: 'Appartenances politiques', exact: true }).selectOption('contemporary');
  await expect(page).toHaveURL(/circleTiming=contemporary/);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Appartenances politiques', exact: true })).toHaveValue('contemporary');
  await expect(page.getByText(/Une période commune doit être établie/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('mixed careers expose dated source passages and reopen the selected person on the map', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?graphView=system&systemLens=milieus&selected=Q3052772');
  await expect(page.getByRole('heading', { name: 'Qui relie plusieurs milieux ?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fermer la fiche', exact: true })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Rechercher une personne' }).fill('Macron');
  await page.getByRole('button', { name: /^Emmanuel Macron [0-9]+ milieux/ }).click();
  const detail = page.locator('.insights-detail');
  await detail.locator('summary').filter({ hasText: /^Entreprises/ }).click();
  await expect(detail.getByRole('link', { name: 'Déclaration Wikidata', exact: true }).first()).toBeVisible();
  await page.screenshot({ path: info.outputPath('milieus-evidence.png'), fullPage: true });
  await detail.getByRole('button', { name: 'Voir sur la carte' }).click();
  await expect(page).toHaveURL(/systemLens=entities/);
  await expect(page.getByRole('button', { name: 'Fermer la fiche', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Entre plusieurs milieux', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Qui relie plusieurs milieux ?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fermer la fiche', exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('empty filters never invent circles or cross-milieu careers', async ({ page }) => {
  for (const lens of ['circles', 'milieus']) {
    await page.goto(`/?graphView=system&systemLens=${lens}&categories=`);
    await expect(page.locator('.insights-count')).toHaveText(/^0 /);
    await expect(page.getByText(/Aucun résultat avec cette recherche/)).toBeVisible();
    await expect(page.locator('.insight-card')).toHaveCount(0);
  }
});

test('both readings are reachable from the existing Explorer menu', async ({ page }) => {
  await page.goto('/?graphView=system');
  await page.locator('.map-explore-tools > summary').click();
  await page.locator('.map-explore-links').getByRole('button', { name: 'Cercles entre partis' }).click();
  await expect(page).toHaveURL(/systemLens=circles/);
  await page.getByRole('button', { name: 'Fermer explorer', exact: true }).click();
  await page.getByRole('group', { name: 'Explorer les réseaux' }).getByRole('button', { name: 'Parcours entre milieux' }).click();
  await expect(page).toHaveURL(/systemLens=milieus/);
  await expect(page.getByRole('heading', { name: 'Qui relie plusieurs milieux ?' })).toBeVisible();
});

test('the public method explains the source and classification without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/methode');
  await expect(page.getByRole('heading', { name: 'Cercles entre partis', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'annuaire publié par la French-American Foundation France' })).toHaveAttribute('href', 'https://www.french-american.org/programmes-et-evenements/young-leaders/');
  await page.getByText('Institutions et fonctions retenues dans la classification', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'Rothschild & Cie', exact: true })).toHaveAttribute('href', '/entite/Q3022385');
  await context.close();
});
