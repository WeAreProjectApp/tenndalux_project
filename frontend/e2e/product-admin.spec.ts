import { test, expect } from './improve-observability/admin-fixture';
import type { Page } from '@playwright/test';
import { FlowTags } from './helpers/flow-tags';

const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGElEQVR4nGNkaGAgCTCRpnxUw6iGoaQBALsfAKDg6Y6zAAAAAElFTkSuQmCC', 'base64');
const frontend = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function openProduct(page: Page, name: string) {
  await page.getByRole('link', { name: 'Productos', exact: true }).first().click();
  await page.getByRole('rowheader').getByRole('link', { name, exact: true }).click();
}

test.beforeEach(async ({ page, adminServer }) => {
  await page.goto('/admin/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address:').fill(adminServer.email);
  await page.getByLabel('Password:', { exact: true }).fill(adminServer.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
});

test('client saves the shared product presentation from Django Admin', {
  tag: [...FlowTags.ADMIN_PRODUCT_EDIT, '@outcome:success'],
}, async ({ page, adminServer }) => {
  await openProduct(page, 'Cortina Ondessence');
  await page.getByLabel('Nombre:', { exact: true }).fill('Ondas de lino');
  await page.getByLabel('Descripción:', { exact: true }).fill('Una cortina de lino elegida por el cliente.');
  await page.getByLabel('Categoría:', { exact: true }).selectOption('persianas');
  await page.getByLabel('Imagen:', { exact: true }).setInputFiles({ name: 'linen.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/core_app\/product\/$/);
  await page.route('**/api/products/', async (route) => {
    await route.fulfill({ response: await page.request.get(`${adminServer.url}/api/products/`) });
  });
  await page.route('**/media/products/**', async (route) => {
    await route.fulfill({ response: await page.request.get(`${adminServer.url}${new URL(route.request().url()).pathname}`) });
  });
  const serviceRead = page.waitForResponse('**/api/products/');
  await page.goto(`${frontend}/servicios/`, { waitUntil: 'domcontentloaded' });
  await serviceRead;
  await expect(page.getByRole('heading', { name: 'Ondas de lino', exact: true })).toHaveText('Ondas de lino');
  await expect(page.getByRole('img', { name: 'Ondas de lino', exact: true })).toHaveJSProperty('naturalWidth', 16);
  const productsRead = page.waitForResponse('**/api/products/');
  await page.getByRole('link', { name: 'Ver Productos', exact: true }).click();
  await productsRead;
  const card = page.getByTestId('product-card-ondessence');
  await expect(card).toContainText('Ondas de lino');
  await page.getByRole('button', { name: 'Persianas', exact: true }).click();
  await expect(card).toContainText('Una cortina de lino elegida por el cliente.');
  await card.getByRole('button', { name: 'Ver Detalles', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ondas de lino', exact: true });
  await expect(dialog).toContainText('Salas amplias');
  await expect(dialog.getByRole('img', { name: 'Ondas de lino', exact: true })).toHaveJSProperty('naturalWidth', 16);
});

test('client sees the fixed product catalogue from the admin index', {
  tag: [...FlowTags.ADMIN_PRODUCT_EDIT, '@outcome:display'],
}, async ({ page }) => {
  await page.getByRole('link', { name: 'Productos', exact: true }).first().click();

  await expect(page.locator('#result_list tbody tr')).toHaveCount(15);
  await expect(page.getByRole('link', { name: 'Add Producto', exact: true })).toHaveCount(0);
  await page.getByRole('rowheader').getByRole('link', { name: 'Luminux', exact: true }).click();
  await expect(page.getByLabel('Nombre:', { exact: true })).toHaveValue('Luminux');
  await expect(page.locator('input[name=key]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Delete', exact: true })).toHaveCount(0);
});

test('client receives a validation error for a product image with invalid bytes', {
  tag: [...FlowTags.ADMIN_PRODUCT_EDIT, '@outcome:error'],
}, async ({ page }) => {
  await openProduct(page, 'Dunes');
  await page.getByLabel('Imagen:', { exact: true }).setInputFiles({ name: 'invalid.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.locator('.field-image .errorlist')).toContainText('El archivo no es una imagen válida.');
  await expect(page.getByLabel('Nombre:', { exact: true })).toHaveValue('Dunes');
});
