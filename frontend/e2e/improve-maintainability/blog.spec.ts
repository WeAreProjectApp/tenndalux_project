import { expect, test } from '@playwright/test';
import { FlowTags, RoleTags } from '../helpers/flow-tags';
import { blogPosts, routeCatalogue } from './catalogue-fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/servicios/', { waitUntil: 'domcontentloaded' });
});

// Bug caught: only the API's first page is displayed, losing entry 21.
test('visitor reads the final published article after navigating to Blog', {
  tag: [...FlowTags.PUBLIC_BLOG_LIST, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', blogPosts);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();

  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.getByRole('heading', { name: 'Artículo publicado 21', exact: true })).toHaveText('Artículo publicado 21');
  await expect(page.getByRole('button', { name: 'Guías finales', exact: true })).toHaveText('Guías finales');
});

// Bug caught: a cover-only catalogue shows a misleading no-results message.
test('visitor reads a catalogue containing a single cover article', {
  tag: [...FlowTags.PUBLIC_BLOG_LIST, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', [blogPosts[0]]);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveText('Portada de diseño');
  await expect(page.getByText('No encontramos artículos con esos criterios')).toHaveCount(0);
});

// Bug caught: the unloaded catalogue is reported as empty after an API failure.
test('visitor recovers the article catalogue after an initial request failure', {
  tag: [...FlowTags.PUBLIC_BLOG_LIST, RoleTags.GUEST, '@outcome:failure'],
}, async ({ page }) => {
  const catalogue = await routeCatalogue(page, '/blog/posts/', blogPosts, 1);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los artículos');
  await expect(page.getByText('No encontramos artículos con esos criterios')).toHaveCount(0);
  catalogue.recover();
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Artículo publicado 21', exact: true })).toHaveText('Artículo publicado 21');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

// Bug caught: a failed second page is silently presented as a complete catalogue.
test('visitor retries the catalogue after its second page fails', {
  tag: [...FlowTags.PUBLIC_BLOG_LIST, RoleTags.GUEST, '@outcome:failure'],
}, async ({ page }) => {
  const catalogue = await routeCatalogue(page, '/blog/posts/', blogPosts, 2);

  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los artículos');
  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveCount(0);
  catalogue.recover();
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Artículo publicado 21', exact: true })).toHaveText('Artículo publicado 21');
  expect(catalogue.requestedPages).toEqual([1, 2, 1, 2]);
});

// Bug caught: searching removes the cover article before evaluating the query.
test('visitor finds the cover article by searching its title', {
  tag: [...FlowTags.PUBLIC_BLOG_FILTER, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', blogPosts);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Diseño', exact: true })).toHaveText('Diseño');

  await page.getByRole('textbox', { name: 'Buscar artículos', exact: true }).fill('Portada');

  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true, level: 3 })).toHaveText('Portada de diseño');
  await expect(page.getByRole('heading', { name: 'Artículo publicado 2', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Buscar artículos', exact: true }).fill('');
  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveCount(1);
});

// Bug caught: the taxonomy from page two cannot be selected or reset.
test('visitor filters the final article category before resetting to Todos', {
  tag: [...FlowTags.PUBLIC_BLOG_FILTER, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', blogPosts);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();

  await page.getByRole('button', { name: 'Guías finales', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Artículo publicado 21', exact: true })).toHaveText('Artículo publicado 21');
  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Artículo publicado 21', exact: true })).toHaveText('Artículo publicado 21');
});

// Bug caught: an unmatched search cannot be cleared through the real empty state.
test('visitor reads the unmatched article search state', {
  tag: [...FlowTags.PUBLIC_BLOG_FILTER, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', blogPosts);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Diseño', exact: true })).toHaveText('Diseño');

  await page.getByRole('textbox', { name: 'Buscar artículos', exact: true }).fill('sin-coincidencias');

  await expect(page.getByText('No encontramos artículos con esos criterios')).toHaveText('No encontramos artículos con esos criterios');
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveText('Portada de diseño');
});

// Bug caught: a null CMS cover downloads the large PNG or displays undecodable media.
test('visitor loads the real lightweight Blog fallback', {
  tag: [...FlowTags.PUBLIC_BLOG_LIST, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', [blogPosts[0]]);
  await page.getByTestId('site-footer').getByRole('link', { name: 'Blog', exact: true }).click();
  const image = page.getByRole('img', { name: 'Portada de diseño', exact: true });

  await expect(image).toHaveAttribute('src', '/home/gallery/cortina-ondessence.webp');
  const width = await image.evaluate(async (element: HTMLImageElement) => { await element.decode(); return element.naturalWidth; });
  const response = await page.request.get('/home/gallery/cortina-ondessence.webp');

  expect(width).toBeGreaterThan(0);
  expect(response.status()).toBe(200);
  expect((await response.body()).length).toBeLessThanOrEqual(200000);
});
