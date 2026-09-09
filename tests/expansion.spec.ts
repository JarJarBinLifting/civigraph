import { expect, test } from '@playwright/test';

for (const person of [
  { id: 'Q59601214', name: 'Manon Aubry', source: 'https://www.europarl.europa.eu/meps/en/full-list/all' },
  { id: 'Q21294609', name: 'Sébastien Chenu', source: 'https://data.assemblee-nationale.fr/acteurs/historique-des-deputes' },
  { id: 'Q41025869', name: 'Pierre Ouzoulias', source: 'https://www.senat.fr/senateur/ouzoulias_pierre19593h.html' },
]) {
  test(`${person.name}: search, map, profile and evidence`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
    await page.getByRole('combobox', { name: 'Rechercher une personne ou une organisation' }).fill(person.name);
    await page.getByRole('option', { name: new RegExp(person.name) }).click();
    await expect(page).toHaveURL(new RegExp(person.id));
    await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
    await page.screenshot({ path: `test-results/expansion-${person.id}-map-${info.project.name}.png` });
    await page.goto(`/entite/${person.id}`);
    await expect(page.getByRole('heading', { level: 1, name: person.name })).toBeVisible();
    const proof = page.locator('details').filter({ has: page.locator(`a[href^="${person.source}"]`) }).first();
    await proof.locator('summary').click();
    await expect(proof.getByRole('link', { name: 'Consulter le document source' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/expansion-${person.id}-profile-${info.project.name}.png` });
    expect(errors).toEqual([]);
  });
}
