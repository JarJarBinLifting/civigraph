import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';

type Canvas = HTMLElement & { _cyreg: { cy: Core } };
const camera = (element: Element) => {
  const cy = (element as Canvas)._cyreg.cy;
  return { zoom: cy.zoom(), x: (cy.width() / 2 - cy.pan().x) / cy.zoom(), y: (cy.height() / 2 - cy.pan().y) / cy.zoom() };
};

test('default map contains the full network and changing reading preserves geometry', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const canvas = page.locator('.system-stage .graph-canvas');
  await expect(canvas).toHaveAttribute('data-nodes', '2394');
  await page.getByRole('button', { name: 'Formation', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-nodes', '735');
  const before = await canvas.evaluate(element => (element as Canvas)._cyreg.cy.nodes().map(n => ({ id: n.id(), ...n.position() })));
  const framing = await canvas.evaluate(camera);
  await page.getByRole('button', { name: 'Individus', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-reading', 'individuals');
  expect(await canvas.evaluate(element => (element as Canvas)._cyreg.cy.nodes().map(n => ({ id: n.id(), ...n.position() })))).toEqual(before);
  expect(await canvas.evaluate(camera)).toEqual(framing);
  await page.reload();
  await expect(canvas).toHaveAttribute('data-system', 'education');
  await expect(canvas).toHaveAttribute('data-reading', 'individuals');
  await expect(page.getByRole('group', { name: 'Explorer la sélection' })).toHaveCount(0);
});

test('isolation retains positions and restores the preceding camera', async ({ page }) => {
  await page.goto('/?graphView=system&system=education&selected=Q273579');
  await expect(page.getByTestId('system-graph-stage')).toHaveAttribute('data-ready', 'true');
  const canvas = page.locator('.system-stage .graph-canvas');
  const positions = await canvas.evaluate(element => (element as Canvas)._cyreg.cy.nodes().map(n => ({ id: n.id(), ...n.position() })));
  const before = await canvas.evaluate(camera);
  await page.getByRole('button', { name: 'Isoler le voisinage', exact: true }).click();
  await expect.poll(() => canvas.evaluate(element => (element as Canvas)._cyreg.cy.animated())).toBe(false);
  expect(await canvas.evaluate(element => (element as Canvas)._cyreg.cy.nodes().filter(n => n.visible()).length)).toBe(121);
  expect(await canvas.evaluate(element => (element as Canvas)._cyreg.cy.nodes().map(n => ({ id: n.id(), ...n.position() })))).toEqual(positions);
  await page.getByRole('button', { name: 'Isoler le voisinage', exact: true }).click();
  await expect.poll(() => canvas.evaluate(camera)).toEqual(before);
  expect(await canvas.evaluate(element => (element as Canvas)._cyreg.cy.nodes().filter(n => n.visible()).length)).toBe(735);
});

test('school evidence distinguishes dated overlap from an official promotion', async ({ page }) => {
  await page.goto('/?graphView=system&system=education&selected=Q273579');
  await page.getByRole('combobox', { name: 'Comparer les passages avec' }).selectOption({ label: 'Emmanuel Macron' });
  const search = page.getByRole('textbox', { name: 'Retrouver un parcours' });
  await search.fill('Matthias Fekl');
  await page.locator('.crossing-person > summary').click();
  await expect(page.locator('.overlap-receipt')).toContainText('Aucune même promotion documentée');
  await expect(page.locator('.crossing-person .political-badges').first()).toContainText('Parti socialiste');
  await search.fill('Sébastien Proto');
  await page.locator('.crossing-person > summary').click();
  await expect(page.locator('.overlap-receipt')).toContainText('Même promotion documentée : Promotion Senghor');
  await expect(page.locator('.crossing-person').getByRole('link', { name: 'Consulter le document officiel', exact: true })).toHaveAttribute('href', 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000437029');
});
