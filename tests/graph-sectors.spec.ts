import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';

type Canvas = HTMLElement & { _cyreg: { cy: Core } };

test('types keep the same side for dated and undated nodes when filters change', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1018, height: 1103 });
  await page.goto('/');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const groups = {
    top: ['Q273579', 'Q859363', 'Q1394262', 'Q1878600', 'Q29889309'],
    right: ['Q191954', 'Q19808845', 'Q17618126', 'Q17618189'],
    left: ['Q2986712', 'Q3022385', 'Q3075672'],
    bottom: ['Q327591', 'Q170972', 'Q23731823'],
  };
  const misplaced = () => page.locator('.graph-canvas').evaluate((element, groups) => {
    const cy = (element as Canvas)._cyreg.cy;
    return Object.entries(groups).flatMap(([side, ids]) => ids.filter(id => {
      const node = cy.$id(id);
      if (!node.length) return false;
      const p = node.position();
      return side === 'top' ? p.y >= 0 : side === 'bottom' ? p.y <= 0 : side === 'left' ? p.x >= 0 : p.x <= 0;
    }));
  }, groups);
  expect(await misplaced()).toEqual([]);
  await expect(page.locator('.guide-sector-label')).toHaveCount(4);
  await expect(page.locator('.guide-unknown')).toHaveCount(4);
  await page.screenshot({ path: `.working/sectors-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Filtres', exact: true }).click();
  await page.getByRole('checkbox', { name: /Formations/ }).uncheck();
  await expect(page.locator('.guide-sector-label')).toHaveCount(3);
  await expect.poll(misplaced).toEqual([]);
  await page.getByRole('checkbox', { name: /Formations/ }).check();
  await expect(page.locator('.guide-sector-label')).toHaveCount(4);
  await expect.poll(misplaced).toEqual([]);
});
