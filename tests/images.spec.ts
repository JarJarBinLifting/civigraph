import { expect, test } from '@playwright/test';
test('local portraits and institutional images expose credits without background third-party requests', async ({ page }, info) => {
  const thirdParty: string[] = [], errors: string[] = [];
  page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') thirdParty.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?root=Q3052772&selected=Q3052772&categories=education');
  const profile = page.locator('.entity-profile');
  await expect(profile.getByRole('img', { name: 'Portrait de Emmanuel Macron', exact: true })).toBeVisible();
  await expect(profile.getByRole('img')).toHaveJSProperty('complete', true);
  await profile.locator('.image-credit summary').click();
  await expect(profile.locator('.image-credit')).toContainText('Kobi');
  await expect(profile.getByRole('link', { name: 'CC BY-SA 4.0', exact: true })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
  await profile.scrollIntoViewIfNeeded();
  await profile.screenshot({ path: `.working/sprint/images-portrait-${info.project.name}.png`, scale: 'css' });
  await page.goto('/?root=Q273579&selected=Q273579&time=all');
  await expect(profile.getByRole('img')).toBeVisible();
  expect(await profile.getByRole('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await profile.locator('.image-credit summary').click();
  await expect(profile.getByRole('link', { name: /Wikimedia Commons/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(thirdParty).toEqual([]); expect(errors).toEqual([]);
});
test('a missing local thumbnail falls back to initials', async ({ page }) => {
  await page.route('**/images/entities/Q3052772-*', route => route.abort());
  await page.goto('/?root=Q3052772&selected=Q3052772');
  const avatar = page.locator('.entity-profile .entity-avatar');
  await expect(avatar).toContainText('EM');
  await expect(avatar.locator('img')).toHaveCount(0);
});
