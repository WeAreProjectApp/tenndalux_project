import { expect, test } from '@playwright/test';
import { FlowTags, RoleTags } from '../helpers/flow-tags';
import { blogPosts, routeCatalogue } from './catalogue-fixtures';

test.beforeEach(async ({ page }) => {
  await routeCatalogue(page, '/blog/posts/', [blogPosts[0]]);
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Portada de diseño', exact: true })).toHaveText('Portada de diseño');
});

// Bug caught: navigation to Services omits the initial published curtain solution.
test('visitor reads the initial curtain solution after navigating to Services', {
  tag: [...FlowTags.PUBLIC_SERVICES_DISPLAY, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);
  await expect(page.getByRole('heading', { name: 'Cortina Ondessence', exact: true })).toHaveText('Cortina Ondessence');
  await expect(page.getByText('Ondas técnicas uniformes', { exact: true })).toHaveText('Ondas técnicas uniformes');
  await expect(page.getByRole('button', { name: 'Cortinas', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

// Bug caught: switching solution tabs fails to replace their specific content.
test('visitor switches the available service solutions', {
  tag: [...FlowTags.PUBLIC_SERVICES_TAB, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);

  await page.getByRole('button', { name: 'Recubrimientos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recubrimientos para Paredes', exact: true })).toHaveText('Recubrimientos para Paredes');
  await page.getByRole('button', { name: 'Exteriores', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Toldos', exact: true })).toHaveText('Toldos');
  await page.getByRole('button', { name: 'Tecnología', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Automatización Inteligente', exact: true })).toHaveText('Automatización Inteligente');
  await page.getByRole('button', { name: 'Cortinas', exact: true }).click();
  await page.getByRole('button', { name: 'Luminux', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Luminux', exact: true })).toHaveText('Luminux');
});

// Bug caught: the compact exterior card opens details for an unrelated solution.
test('visitor reads the compact Toldos solution details', {
  tag: [...FlowTags.PUBLIC_SERVICES_EXTERIOR_MOBILE_DETAIL, RoleTags.GUEST, '@outcome:display'],
}, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);
  await page.getByRole('button', { name: 'Exteriores', exact: true }).click();

  await page.getByRole('button', { name: 'Toldos', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Toldos', exact: true });
  await expect(dialog.getByRole('heading', { name: 'Toldos', exact: true })).toHaveText('Toldos');
  await expect(dialog).toContainText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)');
  await expect(dialog.getByRole('link', { name: 'Cotizar Toldos', exact: true })).toHaveAttribute('href', /wa\.me\/.*Toldos/);
});

// Bug caught: closing the compact bottom sheet leaves scrolling locked.
test('visitor closes the compact exterior bottom sheet through its backdrop', {
  tag: [...FlowTags.PUBLIC_SERVICES_EXTERIOR_MOBILE_DETAIL, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);
  await page.getByRole('button', { name: 'Exteriores', exact: true }).click();
  await page.getByRole('button', { name: 'Toldos', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Toldos', exact: true })).toContainText('Sistema Cofrex');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  await page.getByRole('button', { name: 'Cerrar detalles', exact: true }).click({ position: { x: 10, y: 100 } });

  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await page.getByRole('button', { name: 'Recubrimientos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recubrimientos para Paredes', exact: true })).toHaveText('Recubrimientos para Paredes');
});

// Bug caught: portrait tablets receive hidden compact details instead of full exterior cards.
test('visitor reads full exterior cards on a portrait tablet', {
  tag: [...FlowTags.PUBLIC_SERVICES_TAB, RoleTags.GUEST, '@outcome:success'],
}, async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.getByTestId('site-footer').getByRole('link', { name: 'Servicios', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);

  await page.getByRole('button', { name: 'Exteriores', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Toldos', exact: true })).toHaveText('Toldos');
  await expect(page.getByRole('heading', { name: 'Pérgolas', exact: true })).toHaveText('Pérgolas');
  await expect(page.getByText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)', { exact: true })).toHaveText('Sistema Cofrex con cofre protector (hasta 6 m x 3 m)');
  await expect(page.getByRole('button', { name: 'Toldos', exact: true })).toHaveCount(0);
});
