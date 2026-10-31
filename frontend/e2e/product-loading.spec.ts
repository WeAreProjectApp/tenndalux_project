import { test, expect, type Page, type Locator } from '@playwright/test';
import { FlowTags } from './helpers/flow-tags';
import products from './fixtures/products.json';

async function visitCatalogue(page: Page, start: string, navigation: Locator) {
  const initialRead = page.waitForResponse('**/api/products/');
  await page.goto(start, { waitUntil: 'domcontentloaded' });
  await initialRead;
  const catalogueRead = page.waitForResponse('**/api/products/');
  await navigation.click();
  await catalogueRead;
}

test('visitor retries the Products catalogue after an API outage', {
  tag: [...FlowTags.PUBLIC_PRODUCTS_DISPLAY, '@outcome:failure'],
}, async ({ page }) => {
  await page.route('**/api/products/', (route) => route.fulfill({ status: 503, json: { detail: 'Unavailable' } }));
  await visitCatalogue(page, '/servicios/', page.getByRole('link', { name: 'Ver Productos', exact: true }));
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar los productos.' })).toContainText('No pudimos cargar los productos.');
  await page.route('**/api/products/', (route) => route.fulfill({ json: products }));

  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();

  await expect(page.getByTestId('product-card-ondessence')).toContainText('Cortina Ondessence');
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar los productos.' })).toHaveCount(0);
});

test('visitor understands an empty Products catalogue', {
  tag: [...FlowTags.PUBLIC_PRODUCTS_DISPLAY, '@outcome:display'],
}, async ({ page }) => {
  await page.route('**/api/products/', (route) => route.fulfill({ json: [] }));

  await visitCatalogue(page, '/servicios/', page.getByRole('link', { name: 'Ver Productos', exact: true }));

  await expect(page.getByRole('status')).toHaveText('No hay productos disponibles en esta categoría.');
  await expect(page.getByRole('button', { name: 'Ver Detalles', exact: true })).toHaveCount(0);
});

test('visitor retries the Services products after an API outage', {
  tag: [...FlowTags.PUBLIC_SERVICES_DISPLAY, '@outcome:failure'],
}, async ({ page }) => {
  await page.route('**/api/products/', (route) => route.fulfill({ status: 503, json: { detail: 'Unavailable' } }));
  await visitCatalogue(page, '/productos/', page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }));
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar los productos.' })).toContainText('No pudimos cargar los productos.');
  await page.route('**/api/products/', (route) => route.fulfill({ json: products }));

  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Cortina Ondessence', exact: true })).toHaveText('Cortina Ondessence');
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar los productos.' })).toHaveCount(0);
});

test('visitor understands an empty Services product section', {
  tag: [...FlowTags.PUBLIC_SERVICES_DISPLAY, '@outcome:display'],
}, async ({ page }) => {
  await page.route('**/api/products/', (route) => route.fulfill({ json: [] }));

  await visitCatalogue(page, '/productos/', page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }));

  await expect(page.getByRole('status')).toHaveText('No hay productos disponibles en esta sección.');
  await page.getByRole('button', { name: 'Tecnología', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Automatización Inteligente', exact: true })).toHaveText('Automatización Inteligente');
});

test('visitor receives the brand favicon when navigating the catalogue', {
  tag: [...FlowTags.PUBLIC_FAVICON, '@outcome:display'],
}, async ({ page }) => {
  await page.route('**/api/products/', (route) => route.fulfill({ json: products }));

  await visitCatalogue(page, '/servicios/', page.getByRole('link', { name: 'Ver Productos', exact: true }));

  const icon = page.locator('head link[rel="icon"]');
  await expect(icon).toHaveAttribute('href', '/static/favicon.ico?v=tenndalux-2');
  const response = await page.request.get((await icon.getAttribute('href'))!);
  expect(response.status()).toBe(200);
  expect((await response.body()).subarray(0, 6)).toEqual(Buffer.from([0, 0, 1, 0, 5, 0]));
});
