import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1366, height: 600 }, { width: 1280, height: 650 }]) {
  test(`the map remains the main surface with an institution open at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
    await page.getByRole('combobox', { name: 'Rechercher une personne ou une organisation' }).fill('Sciences Po Paris');
    await page.getByRole('option', { name: 'Sciences Po Paris Établissement', exact: true }).click();
    await expect(page.locator('.detail-panel')).toContainText('Sciences Po Paris');
    const canvas = page.locator('.system-stage .graph-canvas');
    await expect.poll(() => canvas.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(viewport.height * .58);
    const geometry = await page.evaluate(() => {
      const canvas = document.querySelector('.system-stage .graph-canvas')!.getBoundingClientRect();
      const panel = document.querySelector('.detail-panel')!.getBoundingClientRect();
      return { width: canvas.width, right: canvas.right, panelLeft: panel.left, overflow: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth };
    });
    expect(geometry.width).toBeGreaterThanOrEqual(viewport.width * .72);
    expect(geometry.right).toBeLessThanOrEqual(geometry.panelLeft);
    expect(geometry.overflow).toBe(false);
    await page.screenshot({ path: info.outputPath('institution-laptop.png'), fullPage: true });
  });
}

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
