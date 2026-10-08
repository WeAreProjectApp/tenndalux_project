import { expect, test } from '@playwright/test';
import { FlowTags, RoleTags } from '../helpers/flow-tags';

test.beforeEach(async ({ page }) => {
  await page.goto('/servicios/', { waitUntil: 'domcontentloaded' });
});

// Bug caught: the Products route has no working public entry point.
test('visitor reaches the published product cards from Services', {
  tag: [...FlowTags.PUBLIC_PRODUCTS_DISPLAY, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await page.getByRole('link', { name: 'Ver Productos', exact: true }).click();

  await expect(page).toHaveURL(/\/productos\/$/);
  await expect(page.getByTestId('product-card-ondessence')).toContainText('Cortina Ondessence');
  await expect(page.getByTestId('product-card-pergolas')).toContainText('Pérgolas');
  await expect(page.getByRole('button', { name: 'Ver Detalles', exact: true })).toHaveCount(15);
});

// Bug caught: selecting a product category leaves unrelated cards on screen.
test('visitor filters products by Persianas', {
  tag: [...FlowTags.PUBLIC_PRODUCTS_FILTER, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.getByRole('link', { name: 'Ver Productos', exact: true }).click();

  await page.getByRole('button', { name: 'Persianas', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Ver Detalles', exact: true })).toHaveCount(2);
  await expect(page.getByTestId('product-card-horizontales')).toContainText('Persianas Horizontales');
  await expect(page.getByTestId('product-card-ondessence')).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver Detalles', exact: true })).toHaveCount(15);
});

// Bug caught: details display data for a different product than the clicked card.
test('visitor reads the selected Ondessence product details', {
  tag: [...FlowTags.PUBLIC_PRODUCT_DETAILS, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await page.getByRole('link', { name: 'Ver Productos', exact: true }).click();

  await page.getByTestId('product-card-ondessence').getByRole('button', { name: 'Ver Detalles', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Cortina Ondessence', exact: true });
  await expect(dialog.getByRole('heading', { name: 'Cortina Ondessence', exact: true })).toHaveText('Cortina Ondessence');
  await expect(dialog).toContainText('Sistema Ripplefold');
  await expect(dialog.getByRole('button', { name: 'Cotizar Cortina Ondessence', exact: true })).toHaveText('Cotizar Cortina Ondessence');
});

// Bug caught: closing product details leaves the overlay blocking the catalogue.
test('visitor closes the selected product details', {
  tag: [...FlowTags.PUBLIC_PRODUCT_DETAILS, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.getByRole('link', { name: 'Ver Productos', exact: true }).click();
  await page.getByTestId('product-card-ondessence').getByRole('button', { name: 'Ver Detalles', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Cortina Ondessence');

  await page.getByRole('button', { name: 'Cerrar detalles', exact: true }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Persianas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver Detalles', exact: true })).toHaveCount(2);
});
