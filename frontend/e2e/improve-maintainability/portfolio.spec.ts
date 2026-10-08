import { expect, test } from '@playwright/test';
import { FlowTags, RoleTags } from '../helpers/flow-tags';
import { portfolioProjects, routeCatalogue } from './catalogue-fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/servicios/', { waitUntil: 'domcontentloaded' });
});

// Bug caught: additional featured projects or the final API page disappear from the grid.
test('visitor reads the published portfolio after navigating from Services', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_LIST, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/portfolio/projects/', portfolioProjects);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Portafolio', exact: true }).click();

  await expect(page).toHaveURL(/\/portafolio\/$/);
  await expect(page.getByRole('heading', { name: 'Residencia de portada', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 2', exact: true })).toHaveText('Proyecto publicado 2');
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 21', exact: true })).toHaveText('Proyecto publicado 21');
});

// Bug caught: a valid empty portfolio is indistinguishable from a loading failure.
test('visitor reads the empty published portfolio', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_LIST, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/portfolio/projects/', []);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Portafolio', exact: true }).click();

  await expect(page.getByText('No hay proyectos en esta categoría aún')).toHaveText('No hay proyectos en esta categoría aún');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

// Bug caught: API outages are rendered as an unpublished portfolio with no recovery.
test('visitor recovers the portfolio after an initial request failure', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_LIST, RoleTags.GUEST, '@outcome:failure'],
}, async ({ page }) => {
  const catalogue = await routeCatalogue(page, '/portfolio/projects/', portfolioProjects, 1);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Portafolio', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los proyectos');
  await expect(page.getByText('No hay proyectos en esta categoría aún')).toHaveCount(0);
  catalogue.recover();
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 21', exact: true })).toHaveText('Proyecto publicado 21');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

// Bug caught: a failed page two leaves a partial portfolio on screen.
test('visitor retries the portfolio after a later page fails', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_LIST, RoleTags.GUEST, '@outcome:failure'],
}, async ({ page }) => {
  const catalogue = await routeCatalogue(page, '/portfolio/projects/', portfolioProjects, 2);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Portafolio', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los proyectos');
  await expect(page.getByRole('heading', { name: 'Residencia de portada', exact: true })).toHaveCount(0);
  catalogue.recover();
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 21', exact: true })).toHaveText('Proyecto publicado 21');
  expect(catalogue.requestedPages).toEqual([1, 2, 1, 2]);
});

// Bug caught: the selected category loses its cover project or another featured project.
test('visitor filters a category containing multiple featured projects', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_FILTER, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await routeCatalogue(page, '/portfolio/projects/', portfolioProjects);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Portafolio', exact: true }).click();

  await page.getByRole('button', { name: 'Residencial', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Residencia de portada', exact: true, level: 3 })).toHaveText('Residencia de portada');
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 2', exact: true, level: 3 })).toHaveText('Proyecto publicado 2');
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 21', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Residencia de portada', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 21', exact: true })).toHaveText('Proyecto publicado 21');
});

// Bug caught: the taxonomy on page two is absent from the category controls.
test('visitor reads projects matching the last-page category', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_FILTER, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/portfolio/projects/', portfolioProjects);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Portafolio', exact: true }).click();

  await page.getByRole('button', { name: 'Hotelería', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Proyecto publicado 21', exact: true })).toHaveText('Proyecto publicado 21');
  await expect(page.getByRole('heading', { name: 'Proyecto publicado 2', exact: true })).toHaveCount(0);
});

// Bug caught: a project without an uploaded image still downloads the large PNG.
test('visitor loads the real lightweight Portfolio fallback', {
  tag: [...FlowTags.PUBLIC_PORTFOLIO_LIST, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/portfolio/projects/', [portfolioProjects[0]]);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Portafolio', exact: true }).click();
  const image = page.getByRole('img', { name: 'Residencia de portada', exact: true });

  await expect(image).toHaveAttribute('src', '/home/gallery/ejemplo-uso-general.webp');
  const width = await image.evaluate(async (element: HTMLImageElement) => { await element.decode(); return element.naturalWidth; });
  const response = await page.request.get('/home/gallery/ejemplo-uso-general.webp');

  expect(width).toBeGreaterThan(0);
  expect(response.status()).toBe(200);
  expect((await response.body()).length).toBeLessThanOrEqual(200000);
});
