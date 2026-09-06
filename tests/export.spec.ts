import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('exports a real PNG of the framed map with its context while preserving the view', async ({ page }, info) => {
  await page.goto('/?root=Q3052772&categories=education&year=2001');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await page.waitForFunction(() => {
    const element = document.querySelector('.graph-canvas') as HTMLElement & { _cyreg?: { cy: import('cytoscape').Core } };
    return element?._cyreg?.cy.nodes(':backgrounding').length === 0;
  });
  const guides = await page.locator('.graph-guides').evaluate(svg => {
    const bounds = svg.getBoundingClientRect();
    return { width: bounds.width, labels: Array.from(svg.querySelectorAll('text')).map(label => {
      const box = label.getBoundingClientRect();
      return { x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height };
    }) };
  });
  const url = page.url();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter la carte en PNG', exact: true }).click({ timeout: 4000 });
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^civigraph-.*\.png$/);
  const path = `.working/sprint/lot5b-export-${info.project.name}.png`;
  await download.saveAs(path);
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBeGreaterThanOrEqual(1200);
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(600);
  expect(bytes.length).toBeGreaterThan(20_000);
  const captionInk = await page.evaluate(async ({ encoded, guides }) => {
    const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    const scale = (image.width - 96) / guides.width;
    // This fixture has a one-line title and six one-line context fields.
    // The chart therefore starts at y=376, with a 48px page margin.
    return guides.labels.map(box => {
      const pixels = context.getImageData(Math.round(48 + box.x * scale), Math.round(376 + box.y * scale), Math.ceil(box.width * scale), Math.ceil(box.height * scale)).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 155 && pixels[i + 1] < 155 && pixels[i + 2] < 155) ink++;
      return ink;
    });
  }, { encoded: bytes.toString('base64'), guides });
  expect(captionInk.length).toBeGreaterThan(0);
  for (const ink of captionInk) expect(ink).toBeGreaterThan(5);
  await expect(page.getByRole('status').filter({ hasText: 'PNG exporté' })).toBeVisible();
  expect(page.url()).toBe(url);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
});
