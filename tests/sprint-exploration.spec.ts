import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';
type Canvas = HTMLElement & { _cyreg: { cy: Core } };
const assas = '/?root=Q20089181&focus=Q662976&expanded=Q20089181,Q662976&selected=Q662976&time=all';

test('camera translation preserves node styles and the complete dense network', async ({ page }) => {
  await page.goto(assas);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const result = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    let styles = 0;
    const observe = () => styles++;
    cy.on('style', observe);
    for (let i = 0; i < 20; i++) cy.panBy({ x: i % 2 ? 1 : -1, y: 0 });
    cy.off('style', observe);
    return { styles, nodes: cy.nodes().length, edges: cy.edges().length };
  });
  expect(result).toEqual({ styles: 0, nodes: 69, edges: 70 });
});

test('enlarging the map keeps its instance, filters and navigation, with an accessible exit', async ({ page }) => {
  await page.goto(assas);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.locator('.graph-canvas').evaluate(element => (element as Canvas)._cyreg.cy.scratch('beforeEnlarge', true));
  const url = page.url();
  const trigger = page.getByRole('button', { name: 'Agrandir la carte', exact: true });
  await trigger.click({ timeout: 3000 });
  const enlarged = page.getByRole('dialog', { name: 'Carte agrandie', exact: true });
  await expect(enlarged).toBeVisible();
  await expect(enlarged.getByRole('button', { name: 'Réduire la carte', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await enlarged.evaluate(element => element.contains(document.activeElement))).toBe(true);
  expect(await page.locator('.graph-canvas').evaluate(element => (element as Canvas)._cyreg.cy.scratch('beforeEnlarge'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(enlarged).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(page.url()).toBe(url);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('dialogs contain keyboard focus and return it after Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Partager la vue', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Partager cette exploration' });
  await expect(dialog.getByRole('button', { name: 'Fermer la fenêtre' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
