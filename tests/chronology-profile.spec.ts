import { expect, test } from '@playwright/test';
import type { Core } from 'cytoscape';
import coverage from '../docs/current-coverage.json' with { type: 'json' };

const assasCount = coverage.graphCounts.assas;

type Canvas = HTMLElement & { _cyreg: { cy: Core } };
const assas = '/?root=Q20089181&focus=Q662976&expanded=Q20089181,Q662976&selected=Q662976&time=all';
const albane = '/?root=Q20089181&focus=Q30527240&expanded=Q20089181,Q662976,Q30527240&selected=Q30527240&time=all';

test('the full Assas network stays visible and a chosen time reference survives sharing', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1982, height: 1103 });
  await page.goto(assas);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  const placement = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const distance = (id: string) => { const p = cy.getElementById(id).position(); return Math.hypot(p.x, p.y); };
    return { mestre: distance('Q19629414'), attal: distance('Q30339350'), unknown: cy.getElementById('Q11984595').data('timeBand') };
  });
  // At the 2026 reference, 2008–2010 is nearer than 1998–2004; a lone end is unknown.
  expect(placement.attal).toBeLessThan(placement.mestre);
  expect(placement.unknown).toBe('unknown');
  expect(await page.locator('.graph-canvas').evaluate(element => (element as Canvas)._cyreg.cy.nodes().length)).toBe(assasCount);
  await expect(page.getByRole('navigation', { name: 'Pages du réseau' })).toHaveCount(0);
  await expect(page.getByLabel('Année repère')).toHaveValue('2026');
  await expect(page.locator('.chronology-controls')).toContainText('Dates inconnues');
  await page.getByRole('button', { name: 'Fermer la fiche', exact: true }).click();
  await page.getByRole('button', { name: 'Filtres', exact: true }).click();
  await page.getByLabel('Année repère').fill('2000');
  await page.getByLabel('Année repère').press('Enter');
  await expect(page).toHaveURL(/year=2000/);
  await page.reload();
  await page.getByRole('button', { name: 'Fermer la fiche', exact: true }).click();
  await expect(page.getByLabel('Année repère')).toHaveValue('2000');
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  expect(await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const distance = (id: string) => { const p = cy.getElementById(id).position(); return Math.hypot(p.x, p.y); };
    return distance('Q19629414') < distance('Q30339350');
  })).toBe(true);
  await page.screenshot({ path: `test-results/chronology-assas-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('.graph-canvas').scrollIntoViewIfNeeded();
  const point = await page.locator('.graph-canvas').evaluate(element => {
    const cy = (element as Canvas)._cyreg.cy;
    const position = cy.getElementById('Q30527240').renderedPosition();
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x + position.x, y: bounds.y + position.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.getByRole('heading', { name: 'Albane Gaillot', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Profil', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Développer ce réseau', exact: true }).click();
  await expect.poll(() => page.locator('.graph-canvas').evaluate(element => (element as Canvas)._cyreg.cy.$('node.root').id())).toBe('Q30527240');
  expect(new URL(page.url()).searchParams.get('expanded')).toBe('Q20089181,Q662976,Q30527240');
});

test('a person opens a sourced profile independent of the graph filters', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1982, height: 1103 });
  await page.goto(albane);
  await expect(page.getByTestId('graph-stage')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('tab', { name: 'Profil', exact: true })).toHaveAttribute('aria-selected', 'true');
  const profile = page.getByRole('tabpanel', { name: 'Profil de la personne' });
  await expect(profile).toContainText('Député français');
  await expect(profile).toContainText('2017');
  await expect(profile).toContainText('2022');
  await expect(profile).toContainText('Paris-Panthéon-Assas');
  await page.screenshot({ path: `test-results/profile-albane-${info.project.name}.png`, fullPage: true });
  await profile.getByRole('button', { name: 'Source du repère Député français', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Sources' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('link', { name: 'Déclaration Wikidata', exact: true })).toHaveAttribute('href', /Q30527240#/);
  await page.getByRole('tab', { name: 'Profil', exact: true }).click();
  await expect(profile).toBeVisible();
  await page.goto(albane + '&categories=');
  await expect(profile).toContainText('Député français');
  await expect(profile).toContainText('Paris-Panthéon-Assas');
  await page.getByRole('tab', { name: /Connexions/ }).click();
  await expect(page.getByRole('tabpanel', { name: 'Connexions de l’entité' })).toContainText('Aucun lien avec ces filtres');
});
