import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1366, height: 600 }, { width: 1280, height: 650 }, { width: 1024, height: 576 }]) {
  test(`a ${viewport.width}x${viewport.height} laptop keeps the selected network usable`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
    const canvas = page.locator('.system-stage .graph-canvas');
    await expect.poll(() => canvas.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(240);
    await page.getByRole('combobox', { name: 'Rechercher une personne ou une organisation' }).fill('Emmanuel Macron');
    await page.getByRole('option', { name: /^Emmanuel Macron/ }).click();
    await page.getByRole('button', { name: 'Fermer la fiche', exact: true }).click();
    await expect.poll(() => canvas.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(240);
    const layout = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      return {
        canvasTop: rect('.system-stage .graph-canvas').top,
        canvasBottom: rect('.system-stage .graph-canvas').bottom,
        selectionTop: rect('.system-selection-tools').top,
        selectionBottom: rect('.system-selection-tools').bottom,
        headingBottom: rect('.graph-topbar').bottom,
        legendTop: rect('.political-legend').top,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.selectionTop).toBeGreaterThanOrEqual(layout.headingBottom - 1);
    expect(layout.canvasTop).toBeGreaterThanOrEqual(layout.selectionBottom);
    expect(layout.canvasBottom).toBeLessThanOrEqual(layout.legendTop);
    await page.getByRole('button', { name: 'Zoom avant', exact: true }).click();
    await page.getByRole('button', { name: 'Filtres', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'Filtres et parcours' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Agrandir la carte', exact: true }).click();
    await expect.poll(() => canvas.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(240);
    await page.getByRole('button', { name: 'Réduire la carte', exact: true }).click();
    await page.screenshot({ path: info.outputPath('selected-laptop.png'), fullPage: true });
  });
}
