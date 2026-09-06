import { expect, test } from '@playwright/test';
test('a named local exploration restores comparison modes and can be deleted', async ({ page }, info) => {
  await page.goto('/?root=Q3052772&compare=Q3579995&comparisonMode=paths&mode=list&categories=education&year=2001');
  const button = page.getByRole('button', { name: 'Mes explorations', exact: true });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Mes explorations', exact: true });
  await dialog.getByLabel('Nom de cette exploration').fill('Formation comparée');
  await dialog.getByRole('button', { name: 'Enregistrer cette vue', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Restaurer Formation comparée', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await page.goto('/?root=Q662976&time=all');
  await button.click();
  await page.screenshot({ path: `.working/sprint/lot5a-saved-${info.project.name}.png`, scale: 'css' });
  await dialog.getByRole('button', { name: 'Restaurer Formation comparée', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chemins', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(new URL(page.url()).searchParams.get('categories')).toBe('education');
  expect(new URL(page.url()).searchParams.get('mode')).toBe('list');
  expect(new URL(page.url()).searchParams.get('year')).toBe('2001');
  await button.click();
  await dialog.getByRole('button', { name: 'Supprimer Formation comparée', exact: true }).click();
  await expect(dialog).toContainText('Aucune exploration enregistrée');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('corrupted local storage is explained and kept intact', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('civigraph.saved-views.v1', '{illisible'));
  await page.getByRole('button', { name: 'Mes explorations', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Mes explorations', exact: true }).getByRole('alert')).toContainText('illisibles');
  await expect(page.getByRole('button', { name: 'Enregistrer cette vue', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('civigraph.saved-views.v1'))).toBe('{illisible');
});
