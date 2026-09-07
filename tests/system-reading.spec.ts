import { expect, test } from '@playwright/test';

test('institution bridges expose distinct people and both source passages', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=institutions');
  await page.getByRole('button', { name: /^ENA Établissement/ }).click();
  await page.getByRole('button', { name: '80 personnes partagées avec Sciences Po Paris', exact: true }).click();
  await expect(page.getByText('80 personnes distinctes', { exact: true })).toBeVisible();
  await page.getByText('Emmanuel Macron', { exact: true }).first().click();
  await expect(page.getByRole('link', { name: 'Consulter le document officiel', exact: true })).toBeVisible();
});

test('group threshold, matrix and evidence survive URL restoration', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=common');
  const search = page.getByRole('combobox', { name: 'Ajouter une personne au groupe' });
  for (const name of ['Emmanuel Macron', 'Jacques Attali', 'Matthias Fekl']) {
    await search.fill(name);
    await page.getByRole('option').getByRole('button', { name: `${name} Personnalité` }).click();
  }
  await expect(page.getByText('6 institutions communes', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'À tout le groupe', exact: true }).click();
  await page.getByRole('button', { name: 'Matrice', exact: true }).click();
  await expect(page.getByText('3 institutions communes', { exact: true })).toBeVisible();
  const query = new URL(page.url()).search;
  await page.goto(`/${query}`);
  await expect(search).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retirer Matthias Fekl du groupe' })).toBeVisible();
  await page.getByRole('button', { name: "Sources de Emmanuel Macron à École nationale d'administration", exact: true }).click();
  await expect(page.getByRole('link', { name: 'Consulter le document officiel', exact: true })).toBeVisible();
});

test('system category filters yield an honest empty state', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=common&group=Q3052772,Q364315&categories=');
  await expect(page.getByText('0 institutions communes', { exact: true })).toBeVisible();
  await expect(page.getByText(/Aucune institution commune selon ces critères/)).toBeVisible();
});

test('expanded system retains search and the raw graph has reversible framing', async ({ page }) => {
  await page.goto('/?graphView=system&systemLens=entities&selected=Q273579');
  await page.getByRole('button', { name: 'Agrandir la carte', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Rechercher dans la carte agrandie' })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom avant', exact: true }).click();
  await page.getByRole('button', { name: 'Revenir au cadrage précédent', exact: true }).click();
  await page.getByRole('button', { name: 'Isoler le voisinage', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Isoler le voisinage', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Isoler le voisinage', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Isoler le voisinage', exact: true })).toHaveAttribute('aria-pressed', 'false');
});
