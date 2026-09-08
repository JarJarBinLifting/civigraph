import { expect, test } from '@playwright/test';

test('the 2026 scope exposes its people and selection evidence', async ({ page }, info) => {
  await page.goto('/methode');
  const heading = page.getByRole('heading', { name: 'Le socle politique de 2026' });
  await heading.scrollIntoViewIfNeeded();
  await page.getByText('Consulter les 65 personnes et leurs sources de sélection', { exact: true }).click();
  const section = page.locator('section').filter({ has: heading });
  await expect(section.getByRole('link', { name: 'Jordan Bardella', exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Laurent Nuñez', exact: true })).toHaveAttribute('href', '/entite/Q30729111');
  await expect(section).toContainText('Présidence du groupe RDPI');
  await heading.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/current-method-${info.project.name}.png` });
  await section.getByRole('link', { name: 'Jordan Bardella', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Jordan Bardella' })).toBeVisible();
  const proof = page.locator('details').filter({ hasText: 'Président' }).filter({ hasText: '2026' }).last();
  await proof.locator('summary').click();
  await expect(proof.getByRole('link', { name: 'Consulter le document source' })).toHaveAttribute('href', 'https://rassemblementnational.fr/membre/jordan-bardella');
});

test('a newly included person is searchable and opens a working network', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const search = page.getByRole('combobox', { name: 'Rechercher une personne ou une organisation' });
  await search.fill('Marine Tondelier');
  await page.getByRole('option', { name: /Marine Tondelier/ }).click();
  await expect(page).toHaveURL(/Q29917987/);
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: `test-results/current-network-${info.project.name}.png` });
  expect(errors).toEqual([]);
});
